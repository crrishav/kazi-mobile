import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useToast } from '@/components/toast/toast-provider';
import { Avatar } from '@/components/ui/avatar';
import { Icon } from '@/components/ui/icon';
import { ScreenHeader } from '@/components/ui/screen-header';
import { useTheme } from '@/theme/theme-provider';
import { fontFamily } from '@/theme';
import { useAdjustments, usePostAdjustments, useRestoreAdjustments } from '@/data/accounting/hooks';
import { DEFAULT_LEDGER, DEFAULT_OPEN, EXPENSE_ACCOUNTS, LEDGERS } from '@/data/accounting/mock';
import { accountBalance, accountSide, applyEntry, fmt, getAccountCode, getAccountLabel, groupTotal, visibleChartRows } from '@/data/accounting/utils';
import type { AccountingView, EntryDraft, EntryMode } from '@/data/accounting/types';

import { LedgerView } from './ledger-view';
import { LogEntrySheet } from './log-entry-sheet';
import { SheetView } from './sheet-view';

function emptyDraft(): EntryDraft {
  return { amount: '', debitAcct: 'x5060', creditAcct: 'a1010', direction: 'out', memo: '' };
}

export function Accounting() {
  const theme = useTheme();
  const toast = useToast();

  const { data: adjustments } = useAdjustments();
  const postAdjustments = usePostAdjustments();
  const restoreAdjustments = useRestoreAdjustments();

  const [view, setView] = useState<AccountingView>('sheet');
  const [account, setAccount] = useState<string | null>(null);
  const [open, setOpen] = useState<Record<string, boolean>>(DEFAULT_OPEN);
  const [expensesOpen, setExpensesOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [mode, setMode] = useState<EntryMode>('journal');
  const [draft, setDraft] = useState<EntryDraft>(emptyDraft());

  if (!adjustments) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }

  const totalAssets = groupTotal('assets', adjustments);
  const totalLiab = groupTotal('liab', adjustments);
  const totalEquity = groupTotal('eq', adjustments);
  const claims = totalLiab + totalEquity;
  const diff = totalAssets - claims;
  const balanced = Math.abs(diff) < 1;

  const rows = visibleChartRows(open, adjustments);
  const expenseTotal = EXPENSE_ACCOUNTS.reduce((n, x) => n + accountBalance(x.id, adjustments), 0);

  const toggleGroup = (id: string) => setOpen((s) => ({ ...s, [id]: !s[id] }));

  const openLedger = (id: string) => {
    setAccount(id);
    setView('ledger');
  };
  const backToSheet = () => {
    setView('sheet');
    setAccount(null);
  };

  const openJournal = () => {
    setMode('journal');
    setAddOpen(true);
  };
  const openBank = () => {
    setMode('bank');
    setDraft((d) => ({ ...d, debitAcct: 'x5060', creditAcct: 'a1020' }));
    setAddOpen(true);
  };

  const handleSave = () => {
    const amount = parseInt(draft.amount.replace(/[^0-9]/g, ''), 10);
    if (!amount) {
      toast.show({ message: 'Enter an amount before posting', tone: 'bad' });
      return;
    }
    if (draft.debitAcct === draft.creditAcct) {
      toast.show({ message: 'Debit and credit must be different accounts', tone: 'bad' });
      return;
    }
    const before = adjustments;
    const next = applyEntry(before, draft.debitAcct, draft.creditAcct, amount);
    postAdjustments.mutate(next);
    setAddOpen(false);
    setDraft((d) => ({ ...d, amount: '', memo: '' }));

    const ref = mode === 'journal' ? 'JV-0342' : 'BPV-0421';
    toast.show({
      message: `${ref} posted · Dr ${getAccountLabel(draft.debitAcct)} / Cr ${getAccountLabel(draft.creditAcct)}`,
      tone: 'ok',
      action: { label: 'Undo', onPress: () => restoreAdjustments.mutate(before) },
    });
  };

  if (view === 'ledger' && account) {
    const ledgerEntries = LEDGERS[account] ?? DEFAULT_LEDGER;
    const movement = ledgerEntries.reduce((n, r) => n + r.debit - r.credit, 0);
    const closing = accountBalance(account, adjustments);
    const opening = closing - movement;

    return (
      <View style={[styles.flex, { backgroundColor: theme.background }]}>
        <ScreenHeader
          title={getAccountLabel(account)}
          subtitle={`${getAccountCode(account)} · ${accountSide(account) === 'debit' ? 'Debit' : 'Credit'} balance`}
          onBack={backToSheet}
        />
        <ScrollView contentContainerStyle={styles.content}>
          <LedgerView
            closingBalance={fmt(closing)}
            movement={`${movement >= 0 ? '+' : '−'}${fmt(movement)}`}
            movementPositive={movement >= 0}
            openingBalance={fmt(opening)}
            rows={ledgerEntries.map((r) => ({
              memo: r.memo,
              meta: r.meta,
              debit: r.debit ? fmt(r.debit) : '—',
              credit: r.credit ? fmt(r.credit) : '—',
            }))}
            onPostJournal={openJournal}
            onPostBank={openBank}
          />
        </ScrollView>

        <LogEntrySheet
          visible={addOpen}
          mode={mode}
          onModeChange={setMode}
          draft={draft}
          onChange={(patch) => setDraft((d) => ({ ...d, ...patch }))}
          onClose={() => setAddOpen(false)}
          onSave={handleSave}
          addRef={mode === 'journal' ? 'JV-0342' : 'BPV-0421'}
        />
      </View>
    );
  }

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <ScreenHeader title="Accounting" subtitle="As at 23 Aug 2026 · FY 2082/83" rightSlot={<Avatar initials="AK" tint="dark" size="lg" />} />

      <ScrollView contentContainerStyle={styles.content}>
        <SheetView
          totalAssets={fmt(totalAssets)}
          totalClaims={fmt(claims)}
          balanced={balanced}
          checkDiff={diff === 0 ? '0' : fmt(diff)}
          rows={rows}
          onToggleGroup={toggleGroup}
          onOpenLedger={openLedger}
          expensesOpen={expensesOpen}
          onToggleExpenses={() => setExpensesOpen((v) => !v)}
          expenseTotal={fmt(expenseTotal)}
          expenseRows={EXPENSE_ACCOUNTS.map((x) => ({ id: x.id, code: x.code, label: x.label, amount: accountBalance(x.id, adjustments) }))}
        />
      </ScrollView>

      <Pressable
        onPress={openJournal}
        style={[styles.fab, { backgroundColor: theme.surfaceInverted, boxShadow: theme.scheme === 'light' ? '0 16px 30px -16px rgba(13,31,25,0.85)' : undefined }]}
      >
        <Icon name="plus" size={18} color={theme.onDark.accent} />
        <Text style={[styles.fabLabel, { color: theme.onDark.text }]}>Log entry</Text>
      </Pressable>

      <LogEntrySheet
        visible={addOpen}
        mode={mode}
        onModeChange={setMode}
        draft={draft}
        onChange={(patch) => setDraft((d) => ({ ...d, ...patch }))}
        onClose={() => setAddOpen(false)}
        onSave={handleSave}
        addRef={mode === 'journal' ? 'JV-0342' : 'BPV-0421'}
      />
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
