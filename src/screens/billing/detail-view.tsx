import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { useTheme } from '@/theme/theme-provider';
import { fontFamily, tabularNums } from '@/theme';
import { ACCOUNTS, INVOICE_PILL, METHODS, VAT_RATE } from '@/data/billing/mock';
import type { Invoice } from '@/data/billing/types';
import { appliesVAT, balance, discountAmt, money, n0, n2, npr, paid, statusFull, subtotal, taxable, total, vat } from '@/data/billing/utils';

export interface DetailViewProps {
  invoice: Invoice;
  canEdit?: boolean;
  onAddPayment: () => void;
  onOpenPdf: () => void;
  onEdit?: () => void;
  onCancel?: () => void;
}

export function DetailView({ invoice: v, canEdit = false, onAddPayment, onOpenPdf, onEdit, onCancel }: DetailViewProps) {
  const theme = useTheme();
  const st = statusFull(v);
  const pill = INVOICE_PILL[st];
  const tot = total(v);
  const pd = paid(v);
  const bal = balance(v);
  const canPay = !v.cancelled && bal > 0.5;
  const canCancel = !v.cancelled && pd < 0.5;
  const paidPct = tot > 0 ? Math.min(100, (pd / tot) * 100) : 0;
  const disc = discountAmt(v);
  const bigLabel = st === 'Paid' ? 'Collected in full' : v.cancelled ? 'Voided value' : 'Balance due';
  const bigValue = npr((st === 'Paid' || v.cancelled ? tot : bal) * v.rate);

  return (
    <Animated.View entering={FadeInUp.duration(220)} style={styles.wrap}>
      <Card elevation="inverted" style={styles.balanceCard}>
        <View style={styles.balanceRow}>
          <View style={styles.gap6}>
            <Text style={[styles.eyebrow, { color: theme.onDark.textMuted }]}>{bigLabel}</Text>
            <Text style={[styles.balanceValue, tabularNums, { color: theme.onDark.text }]}>{bigValue}</Text>
          </View>
          <View style={[styles.pill, { backgroundColor: pill.bg }]}>
            <View style={[styles.pillDot, { backgroundColor: pill.dot }]} />
            <Text style={[styles.pillLabel, { color: pill.fg }]}>{pill.label}</Text>
          </View>
        </View>
        <View style={[styles.progressTrack, { backgroundColor: 'rgba(233,241,236,0.14)' }]}>
          <View style={[styles.progressFill, { width: `${paidPct}%`, backgroundColor: theme.onDark.accent }]} />
        </View>
        <View style={styles.threeCol}>
          <View style={styles.gap3}>
            <Text style={[styles.miniLabel, { color: theme.onDark.textMuted }]}>Invoiced</Text>
            <Text style={[styles.miniValue, tabularNums, { color: theme.onDark.text }]}>{money(v.cur, tot)}</Text>
          </View>
          <View style={styles.gap3}>
            <Text style={[styles.miniLabel, { color: theme.onDark.textMuted }]}>Collected</Text>
            <Text style={[styles.miniValue, tabularNums, { color: theme.onDark.accent }]}>{money(v.cur, pd)}</Text>
          </View>
          <View style={styles.gap3}>
            <Text style={[styles.miniLabel, { color: theme.onDark.textMuted }]}>Balance</Text>
            <Text style={[styles.miniValue, tabularNums, { color: theme.onDark.text }]}>{money(v.cur, bal)}</Text>
          </View>
        </View>
        {v.cur !== 'NPR' ? (
          <View style={styles.fxRow}>
            <Text style={[styles.fxTag, { color: theme.onDark.textMuted }]}>FX</Text>
            <Text style={[styles.fxLine, tabularNums, { color: theme.onDark.avatarText }]}>Invoiced at {n2(v.rate)} · NPR value shown at the booked rate</Text>
          </View>
        ) : null}
      </Card>

      {v.cancelled ? (
        <View style={[styles.cancelBanner, { backgroundColor: theme.dangerWash, borderColor: theme.scheme === 'light' ? '#E3C9BE' : theme.border }]}>
          <Icon name="x-circle" size={18} color={theme.dangerWashText} />
          <Text style={[styles.cancelText, { color: theme.dangerWashText }]}>{v.cancelNote}</Text>
        </View>
      ) : null}

      {v.clientName || v.clientPAN || v.clientPhone || v.clientAddress ? (
        <Card elevation="raised" style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Bill to</Text>
            {v.clientPAN ? <Text style={[styles.sectionMeta, { color: theme.textSecondary }]}>PAN {v.clientPAN}</Text> : null}
          </View>
          {v.clientName ? <Text style={[styles.billToLine, { color: theme.textPrimary }]}>{v.clientName}</Text> : null}
          {v.clientAddress ? <Text style={[styles.billToMeta, { color: theme.textSecondary }]}>{v.clientAddress}</Text> : null}
          {v.clientPhone ? <Text style={[styles.billToMeta, { color: theme.textSecondary }]}>{v.clientPhone}</Text> : null}
          {v.paymentType ? (
            <Text style={[styles.billToMeta, { color: theme.textSecondary }]}>
              Payment routes to {v.paymentType}{v.paymentType === 'Bank' && v.bankName ? ` · ${v.bankName}` : ''}
            </Text>
          ) : null}
        </Card>
      ) : null}

      <Card elevation="raised" style={styles.linesCard}>
        <View style={[styles.linesHeader, { backgroundColor: theme.surfaceRaised, borderBottomColor: theme.background }]}>
          <Text style={[styles.linesHeaderText, styles.flex1, { color: theme.textSecondary }]}>Line items · {v.cur}</Text>
          <Text style={[styles.linesHeaderText, styles.qtyCol, { color: theme.textSecondary }]}>Qty</Text>
          <Text style={[styles.linesHeaderText, styles.amountCol, { color: theme.textSecondary }]}>Amount</Text>
        </View>
        {v.lines.map((l, i) => (
          <View key={i} style={[styles.lineRow, { borderTopColor: theme.background }]}>
            <View style={[styles.flex1, styles.gap3]}>
              <Text style={[styles.lineDesc, { color: theme.textPrimary }]}>{l.desc}</Text>
              <Text style={[styles.lineMeta, tabularNums, { color: theme.textSecondary }]}>
                {l.challan ? `${l.challan} · ` : ''}{n2(l.rate)} / {l.unit ?? 'pc'}
              </Text>
            </View>
            <Text style={[styles.lineValue, styles.qtyCol, tabularNums, { color: theme.textPrimary }]}>{n0(l.qty)}</Text>
            <Text style={[styles.lineValue, styles.amountCol, tabularNums, { color: theme.textPrimary }]}>{n2(l.qty * l.rate)}</Text>
          </View>
        ))}
        <View style={[styles.totalsRow, { borderTopColor: theme.background, backgroundColor: theme.surfaceRaised }]}>
          <Text style={[styles.flex1, styles.totalsLabel, { color: theme.textSecondary }]}>Subtotal</Text>
          <Text style={[styles.totalsValue, tabularNums, { color: theme.textPrimary }]}>{money(v.cur, subtotal(v))}</Text>
        </View>
        {disc > 0.5 ? (
          <>
            <View style={[styles.totalsRow, { borderTopColor: theme.background, backgroundColor: theme.surfaceRaised }]}>
              <Text style={[styles.flex1, styles.totalsLabel, { color: theme.textSecondary }]}>
                Discount{v.discountMode === 'pct' && v.discountPct ? ` · ${v.discountPct}%` : ''}
              </Text>
              <Text style={[styles.totalsValue, tabularNums, { color: theme.textPrimary }]}>− {money(v.cur, disc)}</Text>
            </View>
            <View style={[styles.totalsRow, { borderTopColor: theme.background, backgroundColor: theme.surfaceRaised }]}>
              <Text style={[styles.flex1, styles.totalsLabel, { color: theme.textSecondary }]}>Taxable amount</Text>
              <Text style={[styles.totalsValue, tabularNums, { color: theme.textPrimary }]}>{money(v.cur, taxable(v))}</Text>
            </View>
          </>
        ) : null}
        <View style={[styles.totalsRow, { borderTopColor: theme.background, backgroundColor: theme.surfaceRaised }]}>
          <Text style={[styles.flex1, styles.totalsLabel, { color: theme.textSecondary }]}>{appliesVAT(v) ? `VAT ${VAT_RATE}%` : 'VAT · zero-rated / export'}</Text>
          <Text style={[styles.totalsValue, tabularNums, { color: theme.textPrimary }]}>{appliesVAT(v) ? money(v.cur, vat(v)) : '—'}</Text>
        </View>
        <View style={[styles.grandRow, { borderTopColor: theme.border }]}>
          <Text style={[styles.flex1, styles.grandLabel, { color: theme.textPrimary }]}>Invoice total</Text>
          <Text style={[styles.grandValue, tabularNums, { color: theme.textPrimary }]}>{money(v.cur, tot)}</Text>
        </View>
      </Card>

      <Card elevation="raised" style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Delivered under</Text>
          <Text style={[styles.sectionMeta, { color: theme.textSecondary }]}>{v.so}</Text>
        </View>
        {v.challans.map((c) => (
          <View key={c.no} style={[styles.challanRow, { borderColor: theme.border, backgroundColor: theme.surfaceRaised }]}>
            <Icon name="file-text" size={16} color={theme.textPrimary} />
            <Text style={[styles.challanNo, { color: theme.textPrimary }]}>{c.no}</Text>
            <Text style={[styles.challanMeta, tabularNums, { color: theme.textSecondary }]}>{c.meta}</Text>
          </View>
        ))}
      </Card>

      <Card elevation="raised" style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Payments</Text>
          <Text style={[styles.sectionMeta, { color: theme.textSecondary }]}>{v.payments.length ? `${v.payments.length} recorded` : 'none'}</Text>
        </View>
        {v.payments.length === 0 ? (
          <Text style={[styles.noPayments, { color: theme.textSecondary }]}>Nothing received yet. Terms are {v.terms} from the invoice date.</Text>
        ) : (
          v.payments.map((p, i) => {
            const m = METHODS.find((x) => x.id === p.method) ?? METHODS[0];
            const acct = p.acct ? ACCOUNTS.find((a) => a.id === p.acct)?.label : null;
            const diff = p.cur !== 'NPR' ? p.amt * (p.rate - v.rate) : 0;
            const title = m.label === 'Credit' ? 'Credit note applied' : `${m.label}${acct ? ` · ${acct}` : ' received'}`;
            const fxNote = p.cur === 'NPR' ? npr(p.amt) : npr(p.amt * p.rate) + (Math.abs(diff) > 1 ? (diff > 0 ? ' · +' : ' · −') + n0(Math.abs(diff)) : '');
            const fxFg = Math.abs(diff) > 1 ? (diff > 0 ? theme.accentWashText : theme.dangerWashText) : theme.textSecondary;
            return (
              <View key={i} style={styles.paymentRow}>
                <View style={[styles.badge, { backgroundColor: m.badgeBg }]}>
                  <Text style={[styles.badgeText, { color: m.badgeFg }]}>{m.badge}</Text>
                </View>
                <View style={[styles.flex1, styles.gap3]}>
                  <Text style={[styles.paymentTitle, { color: theme.textPrimary }]}>{title}</Text>
                  <Text style={[styles.paymentMeta, tabularNums, { color: theme.textSecondary }]}>
                    {p.ref} · {p.date}
                    {p.cur !== 'NPR' ? ` · @ ${n2(p.rate)}` : ''}
                  </Text>
                </View>
                <View style={styles.paymentAmountCol}>
                  <Text style={[styles.paymentAmount, tabularNums, { color: theme.textPrimary }]}>{money(p.cur, p.amt)}</Text>
                  <Text style={[styles.paymentFxNote, tabularNums, { color: fxFg }]}>{fxNote}</Text>
                </View>
              </View>
            );
          })
        )}
      </Card>

      <View style={styles.actionsRow}>
        <Button
          label={v.cancelled ? 'Invoice cancelled' : bal < 0.5 ? 'Collected in full' : 'Add payment'}
          onPress={onAddPayment}
          disabled={!canPay}
          style={styles.payButton}
        />
        <Button label="PDF" variant="secondary" onPress={onOpenPdf} style={styles.pdfButton} />
      </View>

      {canEdit && (onEdit || onCancel) ? (
        <View style={styles.actionsRow}>
          {onEdit ? <Button label="Edit invoice" variant="secondary" onPress={onEdit} style={styles.flex1} /> : null}
          {onCancel && canCancel ? (
            <Button label="Cancel invoice" variant="dangerOutline" onPress={onCancel} style={styles.flex1} />
          ) : null}
        </View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  balanceCard: { padding: 18, gap: 14 },
  balanceRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 14 },
  gap3: { gap: 3 },
  gap6: { gap: 6 },
  eyebrow: { fontFamily: fontFamily.mono, fontSize: 10, letterSpacing: 0.12 * 10, textTransform: 'uppercase' },
  balanceValue: { fontFamily: fontFamily.semibold, fontSize: 30, letterSpacing: -0.03 * 30, lineHeight: 30 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 28, paddingHorizontal: 11, borderRadius: 999, flexShrink: 0 },
  pillDot: { width: 6, height: 6, borderRadius: 99 },
  pillLabel: { fontSize: 12.5, fontWeight: '600' },
  progressTrack: { height: 5, borderRadius: 99, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 99 },
  threeCol: { flexDirection: 'row', gap: 12 },
  miniLabel: { fontFamily: fontFamily.mono, fontSize: 9.5, letterSpacing: 0.1 * 9.5, textTransform: 'uppercase' },
  miniValue: { fontSize: 13.5, fontWeight: '600' },
  fxRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(233,241,236,0.08)', borderRadius: 11, padding: 10 },
  fxTag: { fontFamily: fontFamily.mono, fontSize: 10 },
  fxLine: { flex: 1, fontSize: 11.5, lineHeight: 11.5 * 1.4 },
  cancelBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 11, borderRadius: 16, borderWidth: 1, padding: 14 },
  cancelText: { flex: 1, fontSize: 13, lineHeight: 13 * 1.45 },
  linesCard: { overflow: 'hidden' },
  linesHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 15, paddingVertical: 13, borderBottomWidth: 1 },
  linesHeaderText: { fontFamily: fontFamily.mono, fontSize: 9.5, letterSpacing: 0.1 * 9.5, textTransform: 'uppercase' },
  flex1: { flex: 1 },
  qtyCol: { width: 44, textAlign: 'right' },
  amountCol: { width: 62, textAlign: 'right' },
  lineRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingHorizontal: 15, paddingVertical: 12, borderTopWidth: 1 },
  lineDesc: { fontSize: 13.5, lineHeight: 13.5 * 1.3 },
  lineMeta: { fontFamily: fontFamily.mono, fontSize: 10 },
  lineValue: { fontFamily: fontFamily.mono, fontSize: 12 },
  totalsRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 15, paddingVertical: 11, borderTopWidth: 1 },
  totalsLabel: { fontSize: 12.5 },
  totalsValue: { fontFamily: fontFamily.mono, fontSize: 12 },
  grandRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 15, paddingVertical: 13, borderTopWidth: 1.5 },
  grandLabel: { fontSize: 13.5, fontWeight: '600' },
  grandValue: { fontFamily: fontFamily.mono, fontSize: 14, fontWeight: '500' },
  section: { padding: 16, gap: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 },
  sectionTitle: { fontFamily: fontFamily.semibold, fontSize: 15 },
  sectionMeta: { fontFamily: fontFamily.mono, fontSize: 10, letterSpacing: 0.1 * 10, textTransform: 'uppercase' },
  challanRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 11, borderRadius: 13, borderWidth: 1 },
  challanNo: { fontFamily: fontFamily.mono, fontSize: 12 },
  challanMeta: { flex: 1, fontSize: 12.5, textAlign: 'right' },
  paymentRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 11 },
  badge: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  badgeText: { fontFamily: fontFamily.mono, fontSize: 9.5, fontWeight: '500' },
  paymentTitle: { fontSize: 13.5, fontWeight: '500' },
  paymentMeta: { fontFamily: fontFamily.mono, fontSize: 10 },
  paymentAmountCol: { alignItems: 'flex-end', gap: 3, flexShrink: 0 },
  paymentAmount: { fontSize: 13.5, fontWeight: '600' },
  paymentFxNote: { fontFamily: fontFamily.mono, fontSize: 10 },
  noPayments: { fontSize: 13, lineHeight: 13 * 1.5 },
  billToLine: { fontSize: 14, fontWeight: '600' },
  billToMeta: { fontSize: 12.5, lineHeight: 12.5 * 1.45 },
  actionsRow: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  payButton: { flex: 1.4, height: 52 },
  pdfButton: { flex: 1, height: 52 },
});
