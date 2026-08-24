import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useToast } from '@/components/toast/toast-provider';
import { Avatar } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { ScreenHeader } from '@/components/ui/screen-header';
import { useTheme } from '@/theme/theme-provider';
import { useAddInvoice, useAddPayment, useInvoices, useOpenChallans, useRemoveOpenChallan, useRestoreInvoices } from '@/data/billing/hooks';
import { CLIENTS, RATES, SYM } from '@/data/billing/mock';
import type { BillingFilter, BillingView, Invoice, OpenChallan, Payment } from '@/data/billing/types';
import { balance, lakh, money, n0, npr, nprOf, paid, status, total } from '@/data/billing/utils';

import { ChallansSheet } from './challans-sheet';
import { DetailView } from './detail-view';
import { InvoiceRow } from './invoice-row';
import { PaySheet, type PayDraft } from './pay-sheet';
import { PdfPreview } from './pdf-preview';
import { Summary } from './summary';

const SHOW_FX = true;

function emptyPayDraft(invoice: Invoice): PayDraft {
  return { amount: '', cur: invoice.cur, method: invoice.cur === 'NPR' ? 'cash' : 'bank', acct: 'nic', ref: '' };
}

export function Billing() {
  const theme = useTheme();
  const toast = useToast();

  const { data: invoices } = useInvoices();
  const { data: openChallans } = useOpenChallans();
  const addInvoice = useAddInvoice();
  const addPayment = useAddPayment();
  const restoreInvoices = useRestoreInvoices();
  const removeOpenChallan = useRemoveOpenChallan();

  const [view, setView] = useState<BillingView>('list');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<BillingFilter>('all');
  const [sheet, setSheet] = useState<'challans' | 'pay' | null>(null);
  const [pdfOpen, setPdfOpen] = useState(false);
  const [payDraft, setPayDraft] = useState<PayDraft | null>(null);

  if (!invoices || !openChallans) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }

  const selected = invoices.find((v) => v.id === selectedId) ?? null;
  const live = invoices.filter((v) => !v.cancelled);
  const outstandingNpr = live.reduce((n, v) => n + nprOf(v, balance(v)), 0);
  const openList = live.filter((v) => balance(v) > 0.5);

  const expo: Partial<Record<string, number>> = {};
  openList.forEach((v) => {
    if (v.cur !== 'NPR') expo[v.cur] = (expo[v.cur] ?? 0) + balance(v);
  });
  const fxExposure = Object.keys(expo).length
    ? `${Object.entries(expo)
        .map(([cur, amt]) => `${SYM[cur as Invoice['cur']]}${n0(amt ?? 0)}`)
        .join(' · ')} unconverted`
    : 'All balances in NPR';

  const collected = invoices.reduce((n, v) => n + v.payments.reduce((m, p) => m + (p.cur === 'NPR' ? p.amt : p.amt * p.rate), 0), 0);
  const overdue = openList.filter((v) => v.dueDays < 0);
  const overdueNpr = overdue.reduce((n, v) => n + nprOf(v, balance(v)), 0);

  const counts = {
    all: invoices.length,
    accepted: invoices.filter((v) => status(v) === 'accepted').length,
    collected: invoices.filter((v) => status(v) === 'collected').length,
    cancelled: invoices.filter((v) => status(v) === 'cancelled').length,
  };
  const filters: { id: BillingFilter; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: counts.all },
    { id: 'accepted', label: 'Accepted', count: counts.accepted },
    { id: 'collected', label: 'Collected', count: counts.collected },
    { id: 'cancelled', label: 'Cancelled', count: counts.cancelled },
  ];
  const shown = invoices.filter((v) => filter === 'all' || status(v) === filter);

  const openDetail = (id: string) => {
    setView('detail');
    setSelectedId(id);
    setSheet(null);
    setPdfOpen(false);
  };
  const backToList = () => {
    setView('list');
    setSelectedId(null);
    setSheet(null);
  };

  const flash = (message: string, before?: Invoice[]) => {
    toast.show({ message, tone: 'ok', action: before ? { label: 'Undo', onPress: () => restoreInvoices.mutate(before) } : undefined });
  };

  const handleRaise = (challan: OpenChallan) => {
    const client = CLIENTS[challan.client];
    const seq = 1043 + invoices.filter((v) => v.id.startsWith('n')).length;
    const invoice: Invoice = {
      id: `n${seq}`,
      ref: `INV-${seq}`,
      client: challan.client,
      cur: challan.cur,
      rate: RATES[challan.cur],
      export: challan.cur !== 'NPR',
      so: challan.so,
      issued: '23 Aug',
      due: challan.cur === 'NPR' ? '23 Aug' : '22 Sep',
      dueDays: challan.cur === 'NPR' ? 0 : 30,
      terms: challan.cur === 'NPR' ? 'cash on delivery' : '30 days',
      cancelled: false,
      challans: [{ no: challan.no, meta: `${challan.date} · ${n0(challan.pcs)} pcs` }],
      lines: [{ desc: challan.desc, challan: challan.no, qty: challan.pcs, rate: challan.rate }],
      payments: [],
    };
    addInvoice.mutate(invoice);
    removeOpenChallan.mutate(challan.id);
    setSheet(null);
    flash(`${invoice.ref} raised for ${client.name} off ${challan.no}`);
  };

  const openPay = () => {
    if (!selected) return;
    setPayDraft(emptyPayDraft(selected));
    setSheet('pay');
  };

  const handleSavePayment = () => {
    if (!selected || !payDraft) return;
    const amt = parseFloat(payDraft.amount.replace(/[^0-9.]/g, ''));
    if (!amt) {
      toast.show({ message: 'Enter an amount to record', tone: 'bad' });
      return;
    }
    const rate = payDraft.cur === 'NPR' ? 1 : RATES[payDraft.cur];
    const prefix = payDraft.method === 'cash' ? 'CRV-01' : payDraft.method === 'bank' ? 'BRV-02' : 'CN-00';
    const totalExtra = invoices.reduce((n, v) => n + v.payments.filter((p) => p.ref.startsWith(prefix.slice(0, 3))).length, 0);
    const ref = payDraft.ref.trim() || `${prefix}${32 + totalExtra}`;
    const payment: Payment = { cur: payDraft.cur, amt, rate, method: payDraft.method, acct: payDraft.method === 'bank' ? payDraft.acct : null, ref, date: '23 Aug' };

    const before = invoices;
    addPayment.mutate({ invoiceId: selected.id, payment });
    setSheet(null);
    setPayDraft(null);

    const creditFx = payDraft.cur === selected.cur ? amt : payDraft.cur === 'NPR' ? amt / selected.rate : (amt * rate) / selected.rate;
    const after = total(selected) - (paid(selected) + creditFx);
    flash(`${ref} · ${money(payDraft.cur, amt)} recorded${after < 0.5 ? ' · invoice collected in full' : ''}`, before);
  };

  if (view === 'detail' && selected) {
    return (
      <View style={[styles.flex, { backgroundColor: theme.background }]}>
        <ScreenHeader
          title={CLIENTS[selected.client].name}
          subtitle={`${selected.ref} · ${status(selected)}`}
          onBack={backToList}
          rightSlot={
            <Pressable onPress={() => setPdfOpen(true)} style={[styles.pdfIconButton, { borderColor: theme.border, backgroundColor: theme.surface }]}>
              <Icon name="file-text" size={15} color={theme.textPrimary} />
            </Pressable>
          }
        />
        <ScrollView contentContainerStyle={styles.content}>
          <DetailView invoice={selected} onAddPayment={openPay} onOpenPdf={() => setPdfOpen(true)} />
        </ScrollView>

        <PaySheet
          visible={sheet === 'pay'}
          invoice={selected}
          draft={payDraft ?? emptyPayDraft(selected)}
          onClose={() => {
            setSheet(null);
            setPayDraft(null);
          }}
          onChange={(patch) => setPayDraft((d) => (d ? { ...d, ...patch } : d))}
          onSave={handleSavePayment}
        />
        <PdfPreview
          visible={pdfOpen}
          invoice={selected}
          onClose={() => setPdfOpen(false)}
          onShare={() => {
            setPdfOpen(false);
            flash(`Draft email opened · ${selected.ref}.pdf attached`);
          }}
          onDownload={() => {
            setPdfOpen(false);
            flash(`${selected.ref}.pdf saved to device`);
          }}
        />
      </View>
    );
  }

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <ScreenHeader title="Billing" subtitle="23 Aug 2026 · invoice FX" rightSlot={<Avatar initials="AK" tint="dark" size="lg" />} />
      <ScrollView contentContainerStyle={styles.content}>
        <Summary
          outstandingTotal={npr(outstandingNpr)}
          openCount={openList.length}
          fxExposure={fxExposure}
          collectedMonth={lakh(collected)}
          collectedPct={Math.min(100, (collected / (collected + outstandingNpr || 1)) * 100)}
          collectedMeta={`${npr(collected)} · ${((collected / (collected + outstandingNpr || 1)) * 100).toFixed(0)}% of billed`}
          overdueTotal={overdue.length ? lakh(overdueNpr) : 'रु 0'}
          hasOverdue={overdue.length > 0}
          overdueMeta={overdue.length ? `${npr(overdueNpr)} · ${Math.abs(overdue[0].dueDays)}d late` : 'nothing past terms'}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          {filters.map((f) => {
            const on = filter === f.id;
            return (
              <Pressable
                key={f.id}
                onPress={() => setFilter(f.id)}
                style={[styles.chip, { backgroundColor: on ? theme.surfaceInverted : theme.surface, borderColor: on ? theme.surfaceInverted : theme.border }]}
              >
                <Text style={[styles.chipLabel, { color: on ? theme.onDark.text : theme.textPrimary }]}>{f.label}</Text>
                <Text style={[styles.chipCount, { color: on ? theme.onDark.textMuted : theme.textSecondary }]}>{f.count}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {openChallans.length > 0 ? (
          <Pressable onPress={() => setSheet('challans')} style={[styles.challanBanner, { backgroundColor: theme.accentWash, borderColor: theme.scheme === 'light' ? '#C7E7D6' : theme.border }]}>
            <Icon name="file-text" size={18} color={theme.accentWashText} />
            <Text style={[styles.challanBannerText, { color: theme.accentWashText }]}>
              {openChallans.length} {openChallans.length === 1 ? 'challan' : 'challans'} delivered, not yet invoiced
            </Text>
            <Icon name="chevron-right" size={15} color={theme.accentWashText} />
          </Pressable>
        ) : null}

        {shown.length === 0 ? (
          <EmptyState icon="file-text" title="Nothing in this status" message={`Tap "All" to see every one of the ${invoices.length} invoices raised this quarter.`} />
        ) : (
          shown.map((v, i) => <InvoiceRow key={v.id} invoice={v} index={i} showFx={SHOW_FX} onPress={() => openDetail(v.id)} />)
        )}
      </ScrollView>

      <ChallansSheet visible={sheet === 'challans'} challans={openChallans} onClose={() => setSheet(null)} onRaise={handleRaise} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, paddingTop: 4, paddingBottom: 32, gap: 12 },
  pdfIconButton: { height: 34, width: 34, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  chipsRow: { gap: 7, paddingTop: 2 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 32, paddingHorizontal: 13, borderRadius: 999, borderWidth: 1 },
  chipLabel: { fontWeight: '600', fontSize: 12.5 },
  chipCount: { fontSize: 10.5, opacity: 0.85 },
  challanBanner: { flexDirection: 'row', alignItems: 'center', gap: 11, borderRadius: 16, borderWidth: 1, padding: 14 },
  challanBannerText: { flex: 1, fontSize: 13.5, lineHeight: 13.5 * 1.4 },
});
