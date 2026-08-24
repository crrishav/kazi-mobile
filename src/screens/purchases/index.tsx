import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useToast } from '@/components/toast/toast-provider';
import { Avatar } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { ScreenHeader } from '@/components/ui/screen-header';
import { StatusPill, type StatusKind } from '@/components/ui/status-pill';
import { useTheme } from '@/theme/theme-provider';
import { fontFamily } from '@/theme';
import { useAddEntry, useEntries, useRestoreEntries, useUpdateEntry } from '@/data/purchases/hooks';
import { DAY_LABEL, STATUS, seedEntries } from '@/data/purchases/mock';
import { fmt, money, short } from '@/data/purchases/utils';
import type { PurchaseDraft, PurchaseEntry, PurchaseFilter, PurchaseGroup, PurchaseStatus, PurchaseView } from '@/data/purchases/types';

import { AddSheet } from './add-sheet';
import { DetailView } from './detail-view';
import { EntryGroup } from './entry-group';
import { ListSummary } from './list-summary';

const PILL_KIND: Record<PurchaseStatus, StatusKind> = {
  paid: 'on-track',
  partial: 'at-risk',
  unpaid: 'blocked',
};

const DATE_MAP: Record<PurchaseDraft['date'], string> = {
  today: '2026-08-23',
  yesterday: '2026-08-22',
  earlier: '2026-08-21',
};

function emptyDraft(): PurchaseDraft {
  return { amount: '', supplier: 'Sunrise Mills', item: '', method: 'Cash', status: 'paid', date: 'today', bill: false };
}

export function Purchases() {
  const theme = useTheme();
  const toast = useToast();

  const { data: entries } = useEntries();
  const addEntry = useAddEntry();
  const updateEntry = useUpdateEntry();
  const restoreEntries = useRestoreEntries();

  const [view, setView] = useState<PurchaseView>('list');
  const [group, setGroup] = useState<PurchaseGroup>('date');
  const [filter, setFilter] = useState<PurchaseFilter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [draft, setDraft] = useState<PurchaseDraft>(emptyDraft());

  if (!entries) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }

  const selected = entries.find((e) => e.id === selectedId) ?? null;

  let rows = entries;
  if (filter === 'unpaid') rows = rows.filter((e) => e.status !== 'paid');
  if (filter === 'cash') rows = rows.filter((e) => e.method === 'Cash');
  if (filter === 'bank') rows = rows.filter((e) => e.method === 'Bank');

  const monthTotal = entries.reduce((n, e) => n + e.amount, 0);
  const unpaidTotal = entries.filter((e) => e.status !== 'paid').reduce((n, e) => n + e.amount, 0);
  const cashTotal = entries.filter((e) => e.method === 'Cash').reduce((n, e) => n + e.amount, 0);

  const filters: { id: PurchaseFilter; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: entries.length },
    { id: 'unpaid', label: 'Unpaid', count: entries.filter((e) => e.status !== 'paid').length },
    { id: 'cash', label: 'Cash', count: entries.filter((e) => e.method === 'Cash').length },
    { id: 'bank', label: 'Bank', count: entries.filter((e) => e.method === 'Bank').length },
  ];

  const buckets: { key: string; entries: PurchaseEntry[] }[] = [];
  rows.forEach((e) => {
    const key = group === 'date' ? e.date : e.supplier;
    let b = buckets.find((x) => x.key === key);
    if (!b) {
      b = { key, entries: [] };
      buckets.push(b);
    }
    b.entries.push(e);
  });
  if (group === 'supplier') {
    buckets.sort((a, b) => b.entries.reduce((n, e) => n + e.amount, 0) - a.entries.reduce((n, e) => n + e.amount, 0));
  }

  const flash = (message: string, before: PurchaseEntry[]) => {
    toast.show({ message, tone: 'ok', action: { label: 'Undo', onPress: () => restoreEntries.mutate(before) } });
  };

  const openDetail = (id: string) => {
    setSelectedId(id);
    setView('detail');
  };
  const backToList = () => {
    setView('list');
    setSelectedId(null);
  };

  const openAdd = () => {
    setDraft(emptyDraft());
    setAddOpen(true);
  };

  const handleSave = () => {
    const amount = parseInt(draft.amount.replace(/[^0-9]/g, ''), 10);
    if (!amount) {
      toast.show({ message: 'Enter an amount to save this purchase', tone: 'bad' });
      return;
    }
    const before = entries;
    const item = draft.item.trim() || 'Unspecified material';
    const entry: PurchaseEntry = {
      id: `n${Date.now()}`,
      ref: `PUR-${413 + (entries.length - seedEntries.length)}`,
      supplier: draft.supplier,
      item,
      qty: '—',
      amount,
      method: draft.method,
      status: draft.status,
      date: DATE_MAP[draft.date],
      due: draft.status === 'paid' ? '—' : 'on terms',
      grn: 'pending',
      bill: draft.bill ? 'IMG · just now' : 'Not attached',
      lines: [{ name: item, qty: '—', value: fmt(amount) }],
    };
    addEntry.mutate(entry);
    setAddOpen(false);
    flash(`${entry.ref} · ${money(amount)} recorded`, before);
  };

  const handleMarkPaid = () => {
    if (!selected) return;
    const before = entries;
    updateEntry.mutate({ id: selected.id, updates: { status: 'paid', due: '—' } });
    flash(`${selected.ref} marked paid`, before);
  };

  if (view === 'detail' && selected) {
    const dayTail = (DAY_LABEL[selected.date] ?? selected.date).split(' · ').pop();
    return (
      <View style={[styles.flex, { backgroundColor: theme.background }]}>
        <ScreenHeader
          title={selected.supplier}
          subtitle={`${selected.ref} · ${dayTail}`}
          onBack={backToList}
          rightSlot={<StatusPill status={PILL_KIND[selected.status]} label={STATUS[selected.status].label} />}
        />
        <ScrollView contentContainerStyle={styles.content}>
          <DetailView entry={selected} onMarkPaid={handleMarkPaid} />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <ScreenHeader title="Purchases" subtitle={`${entries.length} entries · August 2026`} rightSlot={<Avatar initials="PT" tint="dark" size="lg" />} />
      <ListSummary
        monthTotal={short(monthTotal)}
        unpaidTotal={short(unpaidTotal)}
        cashShare={`${monthTotal ? Math.round((cashTotal / monthTotal) * 100) : 0}%`}
        group={group}
        onGroupChange={setGroup}
        filters={filters}
        activeFilter={filter}
        onFilterChange={setFilter}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {rows.length === 0 ? (
          <EmptyState icon="shopping-bag" title="No purchases here" message={`Clear the filter to see all ${entries.length} entries this month.`} />
        ) : (
          buckets.map((b) => (
            <EntryGroup
              key={b.key}
              title={group === 'date' ? (DAY_LABEL[b.key] ?? b.key) : b.key}
              total={short(b.entries.reduce((n, e) => n + e.amount, 0))}
              hasUnpaid={b.entries.some((e) => e.status !== 'paid')}
              entries={b.entries}
              group={group}
              onOpen={openDetail}
            />
          ))
        )}
      </ScrollView>

      <Pressable
        onPress={openAdd}
        style={[styles.fab, { backgroundColor: theme.surfaceInverted, boxShadow: theme.scheme === 'light' ? '0 16px 30px -16px rgba(13,31,25,0.85)' : undefined }]}
      >
        <Icon name="plus" size={18} color={theme.onDark.accent} />
        <Text style={[styles.fabLabel, { color: theme.onDark.text }]}>Add purchase</Text>
      </Pressable>

      <AddSheet visible={addOpen} draft={draft} onClose={() => setAddOpen(false)} onChange={(p) => setDraft((d) => ({ ...d, ...p }))} onSave={handleSave} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, paddingTop: 4, paddingBottom: 110, gap: 16 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    height: 52,
    paddingLeft: 17,
    paddingRight: 20,
    borderRadius: 17,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  fabLabel: { fontFamily: fontFamily.semibold, fontSize: 14.5 },
});
