import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/auth/auth-context';
import { useToast } from '@/components/toast/toast-provider';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { formatAD } from '@/lib/nepaliDate';
import { useTheme } from '@/theme/theme-provider';
import { fontFamily } from '@/theme';
import { useAdjustStock, useStock } from '@/data/inventory/hooks';
import { useAddEntry, useDeleteEntry, useEntries, useRestoreEntries, useUpdateEntry } from '@/data/purchases/hooks';
import { buildEntry, draftFromEntry } from '@/data/purchases/utils';
import type { PurchaseDraft, PurchaseEntry, PurchaseFilter, PurchaseGroup } from '@/data/purchases/types';

import { AddSheet, emptyLine } from './add-sheet';
import { EntryGroup } from './entry-group';
import { ListSummary } from './list-summary';
import { PurchaseDetailSheet } from './purchase-detail-sheet';

export interface PurchasesPaneProps {
  showSummary?: boolean;
  showFab?: boolean;
  /** Bumping this from a parent opens the "add purchase" sheet. */
  addNonce?: number;
}

function emptyDraft(): PurchaseDraft {
  return {
    id: null,
    party: '',
    category: 'Raw Materials',
    paymentType: 'Cash',
    bankName: '',
    date: new Date().toISOString().slice(0, 10),
    vatBill: false,
    discountAmt: '',
    status: 'paid',
    lines: [emptyLine()],
  };
}

export function PurchasesPane({ showSummary = true, showFab = true, addNonce = 0 }: PurchasesPaneProps) {
  const theme = useTheme();
  const toast = useToast();
  const { profile, can } = useAuth();
  const canEdit = can('purchases');
  const loggedBy = profile?.name ?? 'You';

  const { data: entries } = useEntries();
  const { data: stock } = useStock();
  const addEntry = useAddEntry();
  const updateEntry = useUpdateEntry();
  const deleteEntry = useDeleteEntry();
  const restoreEntries = useRestoreEntries();
  const adjustStock = useAdjustStock();

  const [group, setGroup] = useState<PurchaseGroup>('date');
  const [filter, setFilter] = useState<PurchaseFilter>('all');
  const [search, setSearch] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [draft, setDraft] = useState<PurchaseDraft>(emptyDraft());
  const [detailId, setDetailId] = useState<string | null>(null);

  useEffect(() => {
    if (addNonce > 0) {
      setDraft(emptyDraft());
      setSheetOpen(true);
    }
  }, [addNonce]);

  const list = entries ?? [];
  const detailEntry = list.find((e) => e.id === detailId) ?? null;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return list.filter((e) => {
      if (filter === 'unpaid' && e.status === 'paid') return false;
      if (filter === 'cash' && e.paymentType !== 'Cash') return false;
      if (filter === 'bank' && e.paymentType !== 'Bank') return false;
      if (q && !`${e.party} ${e.category} ${e.expenseId}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [list, filter, search]);

  const monthTotal = list.reduce((n, e) => n + e.amountNPR, 0);
  const unpaidTotal = list.filter((e) => e.status !== 'paid').reduce((n, e) => n + e.amountNPR, 0);
  const cashTotal = list.filter((e) => e.paymentType === 'Cash').reduce((n, e) => n + e.amountNPR, 0);

  const filters: { id: PurchaseFilter; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: list.length },
    { id: 'unpaid', label: 'Unpaid', count: list.filter((e) => e.status !== 'paid').length },
    { id: 'cash', label: 'Cash', count: list.filter((e) => e.paymentType === 'Cash').length },
    { id: 'bank', label: 'Bank', count: list.filter((e) => e.paymentType === 'Bank').length },
  ];

  const buckets: { key: string; title: string; entries: PurchaseEntry[] }[] = [];
  filtered.forEach((e) => {
    const key = group === 'date' ? e.date : e.party;
    let b = buckets.find((x) => x.key === key);
    if (!b) {
      b = { key, title: group === 'date' ? formatAD(e.date) : e.party, entries: [] };
      buckets.push(b);
    }
    b.entries.push(e);
  });
  if (group === 'date') buckets.sort((a, b) => (a.key < b.key ? 1 : -1));
  else buckets.sort((a, b) => b.entries.reduce((n, e) => n + e.amountNPR, 0) - a.entries.reduce((n, e) => n + e.amountNPR, 0));

  const openAdd = () => {
    setDraft(emptyDraft());
    setSheetOpen(true);
  };

  const openEdit = (entry: PurchaseEntry) => {
    setDetailId(null);
    setDraft(draftFromEntry(entry));
    setSheetOpen(true);
  };

  const runStockIn = (entry: PurchaseEntry) => {
    if (!stock) return;
    const matched: string[] = [];
    entry.items.forEach((line) => {
      const hit = stock.find((s) => s.name.toLowerCase() === line.particulars.trim().toLowerCase());
      if (hit) {
        adjustStock.mutate({ name: hit.name, delta: line.quantity });
        matched.push(hit.name);
      }
    });
    if (matched.length) toast.show({ message: `Stocked in: ${matched.join(', ')}`, tone: 'ok' });
  };

  const handleSave = () => {
    const editing = draft.id !== null;
    const before = list;
    const entry = buildEntry(draft, list, loggedBy);
    if (entry.items.length === 0 || !entry.party) {
      toast.show({ message: 'Add a party and at least one line item', tone: 'bad' });
      return;
    }
    if (editing) updateEntry.mutate({ id: entry.id, updates: entry });
    else addEntry.mutate(entry);
    setSheetOpen(false);
    if (!editing) runStockIn(entry);
    toast.show({
      message: `${entry.expenseId} · ${entry.party} ${editing ? 'updated' : 'recorded'}`,
      tone: 'ok',
      action: { label: 'Undo', onPress: () => restoreEntries.mutate(before) },
    });
  };

  const markPaid = (entry: PurchaseEntry) => {
    updateEntry.mutate({ id: entry.id, updates: { status: 'paid' } });
    setDetailId(null);
    toast.show({ message: `${entry.expenseId} marked paid`, tone: 'ok' });
  };

  const removeEntry = (entry: PurchaseEntry) => {
    const before = list;
    deleteEntry.mutate(entry.id);
    setDetailId(null);
    toast.show({
      message: `${entry.expenseId} deleted`,
      tone: 'ok',
      action: { label: 'Undo', onPress: () => restoreEntries.mutate(before) },
    });
  };

  return (
    <View style={styles.wrap}>
      <ListSummary
        monthTotal={monthTotal}
        unpaidTotal={unpaidTotal}
        cashShare={`${monthTotal ? Math.round((cashTotal / monthTotal) * 100) : 0}%`}
        group={group}
        onGroupChange={setGroup}
        filters={filters}
        activeFilter={filter}
        onFilterChange={setFilter}
        search={search}
        onSearchChange={setSearch}
        showSummary={showSummary}
      />

      <View style={styles.list}>
        {buckets.length === 0 ? (
          <EmptyState icon="shopping-bag" title="No purchases here" message={`Clear the filter to see all ${list.length} entries.`} />
        ) : (
          buckets.map((b) => (
            <EntryGroup
              key={b.key}
              title={b.title}
              total={b.entries.reduce((n, e) => n + e.amountNPR, 0)}
              hasUnpaid={b.entries.some((e) => e.status !== 'paid')}
              entries={b.entries}
              group={group}
              onOpen={setDetailId}
            />
          ))
        )}
      </View>

      {showFab && canEdit ? (
        <Pressable
          onPress={openAdd}
          style={[styles.fab, { backgroundColor: theme.surfaceInverted, boxShadow: theme.scheme === 'light' ? '0 16px 30px -16px rgba(13,31,25,0.85)' : undefined }]}
        >
          <Icon name="plus" size={18} color={theme.onDark.accent} />
          <Text style={[styles.fabLabel, { color: theme.onDark.text }]}>Add purchase</Text>
        </Pressable>
      ) : null}

      <PurchaseDetailSheet
        visible={detailId !== null}
        entry={detailEntry}
        canEdit={canEdit}
        onClose={() => setDetailId(null)}
        onEdit={() => detailEntry && openEdit(detailEntry)}
        onMarkPaid={() => detailEntry && markPaid(detailEntry)}
        onDelete={() => detailEntry && removeEntry(detailEntry)}
      />

      <AddSheet
        visible={sheetOpen}
        draft={draft}
        onClose={() => setSheetOpen(false)}
        onChange={(patch) => setDraft((d) => ({ ...d, ...patch }))}
        onSave={handleSave}
        onDelete={
          draft.id
            ? () => {
                const entry = list.find((e) => e.id === draft.id);
                if (entry) {
                  setSheetOpen(false);
                  removeEntry(entry);
                }
              }
            : undefined
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 4 },
  list: { paddingHorizontal: 20, paddingTop: 4, gap: 16 },
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
