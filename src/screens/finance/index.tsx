import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useToast } from '@/components/toast/toast-provider';
import { Icon } from '@/components/ui/icon';
import { useTheme } from '@/theme/theme-provider';
import { fontFamily } from '@/theme';
import { useAddExpense, useExpenses, useUndoExpenses } from '@/data/finance/hooks';
import { LEDGER, YEARS } from '@/data/finance/mock';
import { fmt, lakh } from '@/data/finance/utils';
import type { Expense, ExpenseCategoryId, LedgerRowType } from '@/data/finance/types';

import { AddExpenseSheet, type ExpenseDraft } from './add-expense-sheet';
import { FinanceHeader } from './header';
import { LedgerView, type LedgerFilter, type LedgerViewMonth } from './ledger-view';
import { Overview } from './overview';
import { YearsView } from './years-view';

type FinanceView = 'overview' | 'years' | 'ledger';

function emptyDraft(): ExpenseDraft {
  return { amount: '', categoryId: 'power', note: '', source: 'Bank', hasReceipt: false };
}

export function Finance() {
  const theme = useTheme();
  const toast = useToast();

  const { data: expenses } = useExpenses();
  const addExpense = useAddExpense();
  const undoExpenses = useUndoExpenses();

  const [view, setView] = useState<FinanceView>('overview');
  const [yearId, setYearId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<LedgerFilter>('all');
  const [addOpen, setAddOpen] = useState(false);
  const [draft, setDraft] = useState<ExpenseDraft>(emptyDraft());

  if (!expenses) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }

  const year = YEARS.find((y) => y.id === yearId) ?? null;
  const yearLedger = year ? (LEDGER[year.id] ?? []) : [];

  const typeCounts: Record<LedgerFilter, number> = { all: 0, bank: 0, journal: 0, expense: 0 };
  yearLedger.forEach((m) => m.rows.forEach((r) => {
    typeCounts.all += 1;
    typeCounts[r.type] += 1;
  }));

  const ledgerFilters: { id: LedgerFilter; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: typeCounts.all },
    { id: 'bank', label: 'Bank', count: typeCounts.bank },
    { id: 'journal', label: 'Journal', count: typeCounts.journal },
    { id: 'expense', label: 'Expenses', count: typeCounts.expense },
  ];

  const months: LedgerViewMonth[] = yearLedger
    .map((m) => {
      const rows = typeFilter === 'all' ? m.rows : m.rows.filter((r) => r.type === typeFilter);
      const net = rows.reduce((n, r) => n + (r.dir === 'in' ? r.amount : -r.amount), 0);
      return {
        title: m.month,
        gregorian: m.gregorian,
        net: `${net >= 0 ? '+' : '−'}${lakh(Math.abs(net))}`,
        netPositive: net >= 0,
        rows: rows.map((r) => ({
          type: r.type as LedgerRowType,
          title: r.title,
          meta: r.meta,
          amount: `${r.dir === 'in' ? '+' : '−'}रु ${fmt(r.amount)}`,
          positive: r.dir === 'in',
        })),
      };
    })
    .filter((m) => m.rows.length > 0);

  const openAdd = () => {
    setDraft(emptyDraft());
    setAddOpen(true);
  };

  const patchDraft = (patch: Partial<ExpenseDraft>) => setDraft((d) => ({ ...d, ...patch }));

  const handleSave = () => {
    const amount = parseInt(draft.amount.replace(/[^0-9]/g, ''), 10);
    if (!amount) {
      toast.show({ message: 'Enter an amount to post this expense', tone: 'bad' });
      return;
    }
    const catId: ExpenseCategoryId = draft.categoryId;
    const before = expenses;
    const entry: Expense = {
      id: `n${Date.now()}`,
      cat: catId,
      name: draft.note.trim() || `${catId} expense`,
      meta: `${draft.source} · ${draft.hasReceipt ? 'receipt attached' : 'no receipt'}`,
      amount,
      status: draft.source === 'Payable' ? 'unpaid' : 'paid',
    };
    addExpense.mutate(entry);
    setAddOpen(false);
    toast.show({
      message: `${entry.name} · ${lakh(amount)} posted`,
      tone: 'ok',
      action: { label: 'Undo', onPress: () => undoExpenses.mutate(before) },
    });
  };

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      {view === 'overview' ? (
        <>
          <FinanceHeader title="Finance" subtitle="Bhadra 2083 · month to date" />
          <ScrollView contentContainerStyle={styles.content}>
            <Overview expenses={expenses} onBrowseYears={() => setView('years')} />
          </ScrollView>
        </>
      ) : view === 'years' ? (
        <>
          <FinanceHeader title="Browse by fiscal year" subtitle="Shrawan – Ashad · Nepal" onBack={() => setView('overview')} />
          <ScrollView contentContainerStyle={styles.content}>
            <YearsView
              years={YEARS}
              onOpen={(y) => {
                setYearId(y.id);
                setTypeFilter('all');
                setView('ledger');
              }}
            />
          </ScrollView>
        </>
      ) : (
        <>
          <FinanceHeader
            title={year?.label ?? ''}
            subtitle={year ? `${year.entries.toLocaleString()} entries · ${year.turnover}` : ''}
            onBack={() => setView('years')}
          />
          <ScrollView contentContainerStyle={styles.content}>
            <LedgerView
              filters={ledgerFilters}
              activeFilter={typeFilter}
              onFilterChange={setTypeFilter}
              months={months}
              totalEntries={year?.entries ?? 0}
            />
          </ScrollView>
        </>
      )}

      <AddExpenseSheet visible={addOpen} draft={draft} onClose={() => setAddOpen(false)} onChange={patchDraft} onSave={handleSave} />

      {view === 'overview' ? <AddExpenseFab onPress={openAdd} /> : null}
    </View>
  );
}

function AddExpenseFab({ onPress }: { onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.fab,
        { backgroundColor: theme.surfaceInverted, boxShadow: theme.scheme === 'light' ? '0 16px 30px -16px rgba(13,31,25,0.85)' : undefined },
      ]}
    >
      <Icon name="plus" size={18} color={theme.onDark.accent} />
      <Text style={[styles.fabLabel, { color: theme.onDark.text }]}>Add expense</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, paddingBottom: 110, gap: 12 },
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
  fabLabel: {
    fontFamily: fontFamily.semibold,
    fontSize: 14.5,
  },
});
