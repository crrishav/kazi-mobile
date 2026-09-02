import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';

import { useAuth } from '@/auth/auth-context';
import { useToast } from '@/components/toast/toast-provider';
import { Icon } from '@/components/ui/icon';
import { PermissionNotice } from '@/components/ui/permission-notice';
import { isBlocked, ScreenGate } from '@/components/ui/screen-gate';
import { useTheme } from '@/theme/theme-provider';
import { fontFamily } from '@/theme';
import { useInvoices } from '@/data/billing/hooks';
import { nprOf, paid as invoicePaid } from '@/data/billing/utils';
import { useEmployees } from '@/data/employees-hr/hooks';
import { MONTHS } from '@/data/employees-hr/mock';
import { pay } from '@/data/employees-hr/utils';
import { useEntries as usePurchaseEntries } from '@/data/purchases/hooks';
import { useOrders } from '@/data/sales/hooks';
import {
  useAccounts,
  useAddBankTransaction,
  useAddExpense,
  useAddJournalEntry,
  useAddVatBill,
  useBankTransactions,
  useDeleteBankTransaction,
  useDeleteExpense,
  useDeleteJournalEntry,
  useDeleteOrderCosts,
  useDeleteVatBill,
  useExpenses,
  useJournalEntries,
  useOrderCosts,
  useUndoBankTransactions,
  useUndoExpenses,
  useUndoJournalEntries,
  useUndoOrderCosts,
  useUndoVatBills,
  useUpdateAccountOpening,
  useUpdateExpense,
  useUpdateJournalEntry,
  useUpsertOrderCosts,
  useVatBills,
} from '@/data/finance/hooks';
import { accountLedger, accountSummaries } from '@/data/finance/ledger';
import { BANK_ACCOUNTS, CASH_ACCOUNT, LAST_MONTH_UNITS_PASSED, LEDGER, YEARS } from '@/data/finance/mock';
import { autoLabourRate, buildOrderPnl, summariseOrderPnl, type OrderPnlRow } from '@/data/finance/order-pnl';
import { buildBalanceSheet, buildProfitAndLoss } from '@/data/finance/pnl';
import { fmt, lakh } from '@/data/finance/utils';
import { toCSV } from '@/lib/export/csv';
import type { Expense, ExpenseCategoryId, JournalEntry, LedgerRowType, OrderCosts, VatBill } from '@/data/finance/types';

import { PurchasesPane } from '@/screens/purchases/purchases-pane';

import { AccountLedgerView } from './account-ledger-view';
import { AccountingKpis } from './accounting-kpis';
import { AddExpenseSheet, type ExpenseDraft } from './add-expense-sheet';
import { BalanceSheetView } from './balance-sheet-view';
import { BankTxSheet, type BankTxDraft } from './bank-tx-sheet';
import { BankView } from './bank-view';
import { ExpensesView, type ExpensesFilter } from './expenses-view';
import { FinanceHeader } from './header';
import { JournalSheet, isAdvanceAccount, type JournalDraft } from './journal-sheet';
import { JournalView } from './journal-view';
import { KpiStrip } from './kpi-strip';
import { LedgerView, type LedgerFilter, type LedgerViewMonth } from './ledger-view';
import { OpeningBalanceSheet } from './opening-balance-sheet';
import { OrderCostsSheet, type OrderCostsDraft } from './order-costs-sheet';
import { OrderPnlView, type OrderPnlFilter } from './order-pnl-view';
import { Overview } from './overview';
import { PnlView } from './pnl-view';
import { FinanceTabs, type FinanceTabDef } from './tabs';
import { VatBillSheet, type VatBillDraft } from './vat-bill-sheet';
import { VatBillsView } from './vat-bills-view';
import { YearsView } from './years-view';

type FinanceTabId = 'overview' | 'expenses' | 'vat-bills' | 'purchases' | 'journal' | 'ledger' | 'bank' | 'pnl' | 'balance-sheet' | 'order-pnl';
type Drill = 'years' | 'fy-transactions' | null;
type VatSheet = { mode: 'upload' | 'view' | null; bill: VatBill | null };
type OpeningSheet = { open: boolean; account: string; current: number };

const today = () => new Date().toISOString().slice(0, 10);

function emptyExpenseDraft(): ExpenseDraft {
  return { amount: '', categoryId: 'power', note: '', source: 'Bank', date: today(), hasReceipt: false };
}
function emptyBillDraft(expenseId = ''): VatBillDraft {
  return { expenseId, fileName: '', kind: 'image' };
}
function emptyJournalDraft(): JournalDraft {
  return { id: null, date: today(), amount: '', debitAccount: '', creditAccount: '', description: '', reference: '', partyName: '' };
}
function emptyBankDraft(): BankTxDraft {
  return { bankChoice: 'Bank - NIC Asia', otherBank: '', date: today(), description: '', amount: '', direction: 'Credit', category: 'Customer receipt', reference: '' };
}
function emptyOrderCostsDraft(): OrderCostsDraft {
  return { material: '', labour: '', overhead: '', shipping: '' };
}
function orderCostsDraftFrom(c: OrderCosts): OrderCostsDraft {
  return {
    material: c.material ? String(c.material) : '',
    labour: c.labour ? String(c.labour) : '',
    overhead: c.overhead ? String(c.overhead) : '',
    shipping: c.shipping ? String(c.shipping) : '',
  };
}
function journalDraftFrom(e: JournalEntry): JournalDraft {
  return {
    id: e.id,
    date: e.date,
    amount: String(e.amountNPR),
    debitAccount: e.debitAccount,
    creditAccount: e.creditAccount,
    description: e.description,
    reference: e.reference,
    partyName: e.partyName ?? '',
  };
}

export interface FinanceProps {
  /**
   * `'accounting'` renders the journal / ledger / P&L / balance-sheet subset
   * with an Accounting header — the reference `Accounting.jsx` is literally
   * `Finance.jsx` minus 5 tabs, sharing the same `journal_entries` + `accounts`
   * collections (plan item 12).
   */
  variant?: 'finance' | 'accounting';
}

export function Finance({ variant = 'finance' }: FinanceProps = {}) {
  const theme = useTheme();
  const toast = useToast();
  const router = useRouter();
  const { profile, can, financeTab } = useAuth();
  const isAccounting = variant === 'accounting';
  const section = isAccounting ? 'accounting' : 'finance';

  const expensesQuery = useExpenses();
  const { data: expenses } = expensesQuery;
  const vatBillsQuery = useVatBills();
  const { data: vatBills } = vatBillsQuery;
  const accountsQuery = useAccounts();
  const { data: accounts } = accountsQuery;
  const journalQuery = useJournalEntries();
  const { data: journal } = journalQuery;
  const bankTransactionsQuery = useBankTransactions();
  const { data: bankTransactions } = bankTransactionsQuery;
  const purchasesQuery = usePurchaseEntries();
  const { data: purchases } = purchasesQuery;
  const invoicesQuery = useInvoices();
  const { data: invoices } = invoicesQuery;
  const employeesQuery = useEmployees();
  const { data: employees } = employeesQuery;
  const ordersQuery = useOrders();
  const { data: orders } = ordersQuery;
  const orderCostsQuery = useOrderCosts();
  const { data: orderCosts } = orderCostsQuery;

  const addExpense = useAddExpense();
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();
  const undoExpenses = useUndoExpenses();
  const addVatBill = useAddVatBill();
  const deleteVatBill = useDeleteVatBill();
  const undoVatBills = useUndoVatBills();
  const addJournal = useAddJournalEntry();
  const updateJournal = useUpdateJournalEntry();
  const deleteJournal = useDeleteJournalEntry();
  const undoJournal = useUndoJournalEntries();
  const updateOpening = useUpdateAccountOpening();
  const addBankTx = useAddBankTransaction();
  const deleteBankTx = useDeleteBankTransaction();
  const undoBankTx = useUndoBankTransactions();
  const upsertOrderCosts = useUpsertOrderCosts();
  const deleteOrderCosts = useDeleteOrderCosts();
  const undoOrderCosts = useUndoOrderCosts();

  const canEdit = can(section);
  const loggedBy = profile?.name ?? 'You';

  const [tab, setTab] = useState<FinanceTabId>(isAccounting ? 'journal' : 'overview');
  const [drill, setDrill] = useState<Drill>(null);
  const [yearId, setYearId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<LedgerFilter>('all');
  const [expensesFilter, setExpensesFilter] = useState<ExpensesFilter>('all');
  const [addOpen, setAddOpen] = useState(false);
  const [draft, setDraft] = useState<ExpenseDraft>(emptyExpenseDraft());
  const [vatSheet, setVatSheet] = useState<VatSheet>({ mode: null, bill: null });
  const [billDraft, setBillDraft] = useState<VatBillDraft>(emptyBillDraft());
  const [vatFocusExpenseId, setVatFocusExpenseId] = useState<string | null>(null);
  const [purchasesAddNonce, setPurchasesAddNonce] = useState(0);
  const [journalSheetOpen, setJournalSheetOpen] = useState(false);
  const [journalDraft, setJournalDraft] = useState<JournalDraft>(emptyJournalDraft());
  const [openingSheet, setOpeningSheet] = useState<OpeningSheet>({ open: false, account: '', current: 0 });
  const [bankSheetOpen, setBankSheetOpen] = useState(false);
  const [bankDraft, setBankDraft] = useState<BankTxDraft>(emptyBankDraft());
  const [oplFilter, setOplFilter] = useState<OrderPnlFilter>('all');
  const [oplOrderId, setOplOrderId] = useState<string | null>(null);
  const [oplDraft, setOplDraft] = useState<OrderCostsDraft>(emptyOrderCostsDraft());

  const ledgerSources = useMemo(
    () => ({
      accounts: accounts ?? [],
      journal: journal ?? [],
      purchases: purchases ?? [],
      expenses: expenses ?? [],
      bankTransactions: bankTransactions ?? [],
    }),
    [accounts, journal, purchases, expenses, bankTransactions],
  );
  const cashBankLedgers = useMemo(
    () => [CASH_ACCOUNT, ...BANK_ACCOUNTS].map((name) => accountLedger(name, ledgerSources)),
    [ledgerSources],
  );
  const summaries = useMemo(() => accountSummaries(ledgerSources), [ledgerSources]);

  const payrollNPR = useMemo(
    () => (employees ?? []).filter((e) => e.active).reduce((n, e) => n + pay(e, MONTHS[0]).net, 0),
    [employees],
  );
  const salesRevenueNPR = useMemo(
    () => (invoices ?? []).filter((v) => !v.cancelled).reduce((n, v) => n + nprOf(v, invoicePaid(v)), 0),
    [invoices],
  );
  const pnl = useMemo(
    () =>
      buildProfitAndLoss({
        salesRevenueNPR,
        payrollNPR,
        journal: journal ?? [],
        expenses: expenses ?? [],
        purchases: purchases ?? [],
        accounts: accounts ?? [],
      }),
    [salesRevenueNPR, payrollNPR, journal, expenses, purchases, accounts],
  );
  const balanceSheet = useMemo(() => buildBalanceSheet(ledgerSources, pnl.netProfit), [ledgerSources, pnl.netProfit]);

  const labourRate = useMemo(
    () => autoLabourRate(employees ?? [], MONTHS[1], LAST_MONTH_UNITS_PASSED),
    [employees],
  );
  const costsByOrder = useMemo(
    () => Object.fromEntries((orderCosts ?? []).map((c) => [c.orderId, c])),
    [orderCosts],
  );
  const orderPnlRows = useMemo(
    () => buildOrderPnl(orders ?? [], costsByOrder, labourRate),
    [orders, costsByOrder, labourRate],
  );
  const oplFilteredRows = useMemo(
    () =>
      orderPnlRows.filter((r) =>
        oplFilter === 'all' ? true : oplFilter === 'delivered' ? r.order.stage === 'delivered' : r.order.stage !== 'delivered',
      ),
    [orderPnlRows, oplFilter],
  );
  const oplSummary = useMemo(() => summariseOrderPnl(oplFilteredRows), [oplFilteredRows]);
  const oplFilterCounts = useMemo<Record<OrderPnlFilter, number>>(
    () => ({
      all: orderPnlRows.length,
      active: orderPnlRows.filter((r) => r.order.stage !== 'delivered').length,
      delivered: orderPnlRows.filter((r) => r.order.stage === 'delivered').length,
    }),
    [orderPnlRows],
  );

  if (isBlocked(expensesQuery, vatBillsQuery, accountsQuery, journalQuery, bankTransactionsQuery, purchasesQuery, invoicesQuery, employeesQuery, ordersQuery, orderCostsQuery) || !expenses || !vatBills || !accounts || !journal || !bankTransactions || !purchases || !invoices || !employees || !orders || !orderCosts) return <ScreenGate queries={[expensesQuery, vatBillsQuery, accountsQuery, journalQuery, bankTransactionsQuery, purchasesQuery, invoicesQuery, employeesQuery, ordersQuery, orderCostsQuery]} />;

  const year = YEARS.find((y) => y.id === yearId) ?? null;
  const yearLedger = year ? (LEDGER[year.id] ?? []) : [];

  const tabs: FinanceTabDef<FinanceTabId>[] = isAccounting
    ? [
        { id: 'journal' as const, label: 'Journal', count: journal.length },
        { id: 'ledger' as const, label: 'Ledger' },
        { id: 'pnl' as const, label: 'P&L' },
        { id: 'balance-sheet' as const, label: 'Balance sheet' },
      ]
    : [
        { id: 'overview', label: 'Overview' },
        ...(financeTab('expenses') ? [{ id: 'expenses' as const, label: 'Expenses', count: expenses.filter((e) => e.status === 'Unpaid').length }] : []),
        ...(financeTab('purchases') ? [{ id: 'purchases' as const, label: 'Purchases' }] : []),
        ...(financeTab('vat-bills') ? [{ id: 'vat-bills' as const, label: 'VAT bills', count: vatBills.length }] : []),
        ...(financeTab('journal') ? [{ id: 'journal' as const, label: 'Journal', count: journal.length }] : []),
        ...(financeTab('ledger') ? [{ id: 'ledger' as const, label: 'Ledger' }] : []),
        ...(financeTab('bank') ? [{ id: 'bank' as const, label: 'Bank', count: bankTransactions.length }] : []),
        ...(financeTab('pnl') ? [{ id: 'pnl' as const, label: 'P&L' }] : []),
        ...(financeTab('balance-sheet') ? [{ id: 'balance-sheet' as const, label: 'Balance sheet' }] : []),
        ...(financeTab('order-pnl') ? [{ id: 'order-pnl' as const, label: 'Order P&L' }] : []),
      ];

  // ---- FY transactions drill-down (item 18): 6 sources + breakdown + in/out/net + year nav ----
  const LEDGER_TYPES: LedgerRowType[] = ['bank', 'journal', 'expense', 'purchase', 'payroll', 'sales'];
  const TYPE_LABELS: Record<LedgerRowType, string> = {
    bank: 'Bank',
    journal: 'Journal',
    expense: 'Expenses',
    purchase: 'Purchases',
    payroll: 'Payroll',
    sales: 'Sales',
  };
  const allRows = yearLedger.flatMap((m) => m.rows);
  const typeCount = (t: LedgerRowType) => allRows.filter((r) => r.type === t).length;
  const presentTypes = LEDGER_TYPES.filter((t) => typeCount(t) > 0);

  const ledgerFilters: { id: LedgerFilter; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: allRows.length },
    ...presentTypes.map((t) => ({ id: t as LedgerFilter, label: TYPE_LABELS[t], count: typeCount(t) })),
  ];

  const ledgerBreakdown = presentTypes.map((t) => {
    const rs = allRows.filter((r) => r.type === t);
    return {
      type: t,
      label: TYPE_LABELS[t],
      count: rs.length,
      inSum: lakh(rs.filter((r) => r.dir === 'in').reduce((n, r) => n + r.amount, 0)),
      outSum: lakh(rs.filter((r) => r.dir === 'out').reduce((n, r) => n + r.amount, 0)),
    };
  });

  const filteredRows = typeFilter === 'all' ? allRows : allRows.filter((r) => r.type === typeFilter);
  const moneyInSum = filteredRows.filter((r) => r.dir === 'in').reduce((n, r) => n + r.amount, 0);
  const moneyOutSum = filteredRows.filter((r) => r.dir === 'out').reduce((n, r) => n + r.amount, 0);
  const netSum = moneyInSum - moneyOutSum;

  const exportLedgerCsv = async () => {
    const rows = yearLedger.flatMap((m) =>
      (typeFilter === 'all' ? m.rows : m.rows.filter((r) => r.type === typeFilter)).map((r) => ({ month: m.month, gregorian: m.gregorian, ...r })),
    );
    const csv = toCSV(rows, [
      { header: 'Month', value: (r) => r.month },
      { header: 'Period', value: (r) => r.gregorian },
      { header: 'Type', value: (r) => r.type },
      { header: 'Description', value: (r) => r.title },
      { header: 'Reference', value: (r) => r.meta },
      { header: 'Direction', value: (r) => (r.dir === 'in' ? 'Money in' : 'Money out') },
      { header: 'Amount NPR', value: (r) => Math.round(r.amount) },
    ]);
    await Clipboard.setStringAsync(csv);
    toast.show({ message: `${rows.length} ${rows.length === 1 ? 'row' : 'rows'} copied as CSV`, tone: 'ok' });
  };

  const yearIndex = YEARS.findIndex((y) => y.id === yearId);
  const goYear = (delta: number) => {
    const next = YEARS[yearIndex + delta];
    if (next) {
      setYearId(next.id);
      setTypeFilter('all');
    }
  };

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
          type: r.type,
          title: r.title,
          meta: r.meta,
          amount: `${r.dir === 'in' ? '+' : '−'}रु ${fmt(r.amount)}`,
          positive: r.dir === 'in',
        })),
      };
    })
    .filter((m) => m.rows.length > 0);

  // ---- Expense actions ----
  const openAdd = () => {
    setDraft(emptyExpenseDraft());
    setAddOpen(true);
  };

  const handleSaveExpense = () => {
    const amount = parseInt(draft.amount.replace(/[^0-9]/g, ''), 10);
    if (!amount) {
      toast.show({ message: 'Enter an amount to post this expense', tone: 'bad' });
      return;
    }
    const category: ExpenseCategoryId = draft.categoryId;
    const before = expenses;
    const name = draft.note.trim() || `${category} expense`;
    const entry: Expense = {
      id: `n${Date.now()}`,
      category,
      name,
      note: draft.note.trim() || '—',
      amountNPR: amount,
      date: draft.date,
      source: draft.source,
      vatBill: draft.hasReceipt,
      status: draft.source === 'Payable' ? 'Unpaid' : 'Paid',
      loggedBy,
    };
    addExpense.mutate(entry);
    setAddOpen(false);
    toast.show({
      message: `${name} · ${lakh(amount)} posted`,
      tone: 'ok',
      action: { label: 'Undo', onPress: () => undoExpenses.mutate(before) },
    });
  };

  const togglePaid = (e: Expense) => {
    const next = e.status === 'Paid' ? 'Unpaid' : 'Paid';
    updateExpense.mutate({ id: e.id, updates: { status: next } });
    toast.show({ message: `${e.name} marked ${next.toLowerCase()}`, tone: 'ok' });
  };

  const removeExpense = (e: Expense) => {
    const beforeExpenses = expenses;
    const beforeBills = vatBills;
    deleteExpense.mutate(e.id);
    toast.show({
      message: `${e.name} deleted`,
      tone: 'ok',
      action: {
        label: 'Undo',
        onPress: () => {
          undoExpenses.mutate(beforeExpenses);
          undoVatBills.mutate(beforeBills);
        },
      },
    });
  };

  // ---- VAT bill actions ----
  const openUpload = (expenseId = '') => {
    setBillDraft(emptyBillDraft(expenseId));
    setVatSheet({ mode: 'upload', bill: null });
  };

  const handleSaveBill = () => {
    const expense = expenses.find((e) => e.id === billDraft.expenseId);
    if (!expense || !billDraft.fileName.trim()) return;
    const bill: VatBill = {
      id: `vb${Date.now()}`,
      expenseId: expense.id,
      item: expense.name,
      fileName: billDraft.fileName.trim(),
      kind: billDraft.kind,
      uploadedBy: loggedBy,
      date: today(),
    };
    addVatBill.mutate(bill);
    setVatSheet({ mode: null, bill: null });
    toast.show({ message: `VAT bill attached to ${expense.name}`, tone: 'ok' });
  };

  const removeBill = (bill: VatBill) => {
    const before = vatBills;
    deleteVatBill.mutate(bill.id);
    setVatSheet({ mode: null, bill: null });
    toast.show({
      message: `${bill.fileName} deleted`,
      tone: 'ok',
      action: { label: 'Undo', onPress: () => undoVatBills.mutate(before) },
    });
  };

  const jumpToBillFor = (e: Expense) => {
    setVatFocusExpenseId(e.id);
    setTab('vat-bills');
  };

  // ---- Journal actions ----
  const openAddJournal = () => {
    setJournalDraft(emptyJournalDraft());
    setJournalSheetOpen(true);
  };
  const openEditJournal = (e: JournalEntry) => {
    setJournalDraft(journalDraftFrom(e));
    setJournalSheetOpen(true);
  };

  const handleSaveJournal = () => {
    const amount = parseInt(journalDraft.amount.replace(/[^0-9]/g, ''), 10) || 0;
    const needsParty = isAdvanceAccount(journalDraft.debitAccount) || isAdvanceAccount(journalDraft.creditAccount);
    if (
      amount <= 0 ||
      !journalDraft.debitAccount ||
      !journalDraft.creditAccount ||
      journalDraft.debitAccount === journalDraft.creditAccount ||
      !journalDraft.description.trim() ||
      (needsParty && !journalDraft.partyName.trim())
    ) {
      toast.show({ message: 'Check the entry — Dr ≠ Cr, amount, description all required', tone: 'bad' });
      return;
    }
    const editing = journalDraft.id !== null;
    const before = journal;
    const payload: JournalEntry = {
      id: journalDraft.id ?? `j${Date.now()}`,
      date: journalDraft.date,
      description: journalDraft.description.trim(),
      debitAccount: journalDraft.debitAccount,
      creditAccount: journalDraft.creditAccount,
      amountNPR: amount,
      reference: journalDraft.reference.trim() || `JV-${String(before.length + 332).padStart(4, '0')}`,
      partyName: needsParty ? journalDraft.partyName.trim() : undefined,
      createdBy: loggedBy,
    };
    if (editing) updateJournal.mutate({ id: payload.id, updates: payload });
    else addJournal.mutate(payload);
    setJournalSheetOpen(false);
    toast.show({
      message: `${payload.reference} ${editing ? 'updated' : 'posted'}`,
      tone: 'ok',
      action: { label: 'Undo', onPress: () => undoJournal.mutate(before) },
    });
  };

  const removeJournal = () => {
    if (!journalDraft.id) return;
    const before = journal;
    const ref = journal.find((e) => e.id === journalDraft.id)?.reference ?? 'Entry';
    deleteJournal.mutate(journalDraft.id);
    setJournalSheetOpen(false);
    toast.show({
      message: `${ref} deleted`,
      tone: 'ok',
      action: { label: 'Undo', onPress: () => undoJournal.mutate(before) },
    });
  };

  const saveOpening = (value: number) => {
    const acct = accounts.find((a) => a.name === openingSheet.account);
    if (acct) updateOpening.mutate({ id: acct.id, openingBalanceNPR: value });
    setOpeningSheet({ open: false, account: '', current: 0 });
    toast.show({ message: `${openingSheet.account} opening set`, tone: 'ok' });
  };

  // ---- Bank actions ----
  const openAddBank = () => {
    setBankDraft(emptyBankDraft());
    setBankSheetOpen(true);
  };

  const handleSaveBank = () => {
    const amount = parseInt(bankDraft.amount.replace(/[^0-9]/g, ''), 10) || 0;
    const bankAccount = bankDraft.bankChoice === 'Other' ? bankDraft.otherBank.trim() : bankDraft.bankChoice;
    if (amount <= 0 || !bankAccount || !bankDraft.description.trim()) {
      toast.show({ message: 'Bank, amount and description are required', tone: 'bad' });
      return;
    }
    const before = bankTransactions;
    const tx = {
      id: `bt${Date.now()}`,
      bankAccount,
      date: bankDraft.date,
      description: bankDraft.description.trim(),
      amountNPR: amount,
      direction: bankDraft.direction,
      category: bankDraft.category,
      reference: bankDraft.reference.trim(),
      loggedBy,
    };
    addBankTx.mutate(tx);
    setBankSheetOpen(false);
    toast.show({
      message: `${tx.direction === 'Credit' ? '+' : '−'}रु ${amount.toLocaleString('en-IN')} logged`,
      tone: 'ok',
      action: { label: 'Undo', onPress: () => undoBankTx.mutate(before) },
    });
  };

  const removeBankTx = (tx: (typeof bankTransactions)[number]) => {
    const before = bankTransactions;
    deleteBankTx.mutate(tx.id);
    toast.show({
      message: `${tx.description} deleted`,
      tone: 'ok',
      action: { label: 'Undo', onPress: () => undoBankTx.mutate(before) },
    });
  };

  // ---- Order P&L actions ----
  const openOplCosts = (row: OrderPnlRow) => {
    setOplOrderId(row.order.id);
    const existing = costsByOrder[row.order.id] as OrderCosts | undefined;
    setOplDraft(existing ? orderCostsDraftFrom(existing) : emptyOrderCostsDraft());
  };

  const oplOrder = oplOrderId ? (orders.find((o) => o.id === oplOrderId) ?? null) : null;
  const oplHasRecord = oplOrderId ? oplOrderId in costsByOrder : false;

  const handleSaveOplCosts = () => {
    if (!oplOrderId) return;
    const n = (s: string) => parseInt(s.replace(/[^0-9]/g, ''), 10) || 0;
    const before = orderCosts;
    upsertOrderCosts.mutate({
      orderId: oplOrderId,
      material: n(oplDraft.material),
      labour: n(oplDraft.labour),
      overhead: n(oplDraft.overhead),
      shipping: n(oplDraft.shipping),
      updatedBy: loggedBy,
      updatedAt: today(),
    });
    const ref = oplOrder?.ref ?? 'Order';
    setOplOrderId(null);
    toast.show({
      message: `${ref} costs saved`,
      tone: 'ok',
      action: { label: 'Undo', onPress: () => undoOrderCosts.mutate(before) },
    });
  };

  const handleClearOplCosts = () => {
    if (!oplOrderId) return;
    const before = orderCosts;
    const ref = oplOrder?.ref ?? 'Order';
    deleteOrderCosts.mutate(oplOrderId);
    setOplOrderId(null);
    toast.show({
      message: `${ref} costs cleared`,
      tone: 'ok',
      action: { label: 'Undo', onPress: () => undoOrderCosts.mutate(before) },
    });
  };

  // ---- Drill-down views ----
  if (drill === 'years') {
    return (
      <View style={[styles.flex, { backgroundColor: theme.background }]}>
        <FinanceHeader title="Browse by fiscal year" subtitle="Shrawan – Ashad · Nepal" onBack={() => setDrill(null)} />
        <ScrollView contentContainerStyle={styles.content}>
          <YearsView
            years={YEARS}
            onOpen={(y) => {
              setYearId(y.id);
              setTypeFilter('all');
              setDrill('fy-transactions');
            }}
          />
        </ScrollView>
      </View>
    );
  }

  if (drill === 'fy-transactions') {
    return (
      <View style={[styles.flex, { backgroundColor: theme.background }]}>
        <FinanceHeader
          title={year?.label ?? ''}
          subtitle={year ? `${year.entries.toLocaleString()} entries · ${year.turnover}` : ''}
          onBack={() => setDrill('years')}
          rightSlot={
            <Pressable
              onPress={exportLedgerCsv}
              hitSlop={8}
              style={[styles.headerAction, { backgroundColor: theme.surface, borderColor: theme.border }]}
            >
              <Icon name="download" size={16} color={theme.textPrimary} />
            </Pressable>
          }
        />
        <ScrollView contentContainerStyle={styles.content}>
          <LedgerView
            filters={ledgerFilters}
            activeFilter={typeFilter}
            onFilterChange={setTypeFilter}
            months={months}
            totalEntries={year?.entries ?? 0}
            moneyIn={`रु ${fmt(moneyInSum)}`}
            moneyOut={`रु ${fmt(moneyOutSum)}`}
            net={`${netSum >= 0 ? '+' : '−'}रु ${fmt(Math.abs(netSum))}`}
            netPositive={netSum >= 0}
            breakdown={ledgerBreakdown}
            yearLabel={year?.label ?? ''}
            onPrevYear={() => goYear(1)}
            onNextYear={() => goYear(-1)}
            hasPrevYear={yearIndex >= 0 && yearIndex < YEARS.length - 1}
            hasNextYear={yearIndex > 0}
          />
        </ScrollView>
      </View>
    );
  }

  // ---- Tabbed hub ----
  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <FinanceHeader
        title={isAccounting ? 'Accounting' : 'Finance'}
        subtitle={isAccounting ? 'Double-entry · FY 2082/83' : 'Bhadra 2083 · month to date'}
      />
      <View style={styles.kpiWrap}>
        {isAccounting ? (
          <AccountingKpis
            totalIncome={pnl.totalIncome}
            totalExpenses={pnl.totalExpenses}
            netProfit={pnl.netProfit}
            entryCount={journal.length}
          />
        ) : (
          <KpiStrip
            payrollMTD={pnl.payroll}
            totalExpenses={pnl.totalExpenses}
            totalPurchases={pnl.purchases}
            netProfit={pnl.netProfit}
            onPressPayroll={() => router.push('/employees-hr')}
            onPressPurchases={() => financeTab('purchases') && setTab('purchases')}
          />
        )}
      </View>
      <FinanceTabs tabs={tabs} active={tab} onChange={setTab} />

      <ScrollView contentContainerStyle={styles.content}>
        {!canEdit ? <PermissionNotice section={section} /> : null}

        {tab === 'overview' ? (
          <Overview expenses={expenses} onBrowseYears={() => setDrill('years')} />
        ) : tab === 'expenses' ? (
          <ExpensesView
            expenses={expenses}
            filter={expensesFilter}
            onFilterChange={setExpensesFilter}
            canEdit={canEdit}
            onTogglePaid={togglePaid}
            onDelete={removeExpense}
            onViewBill={jumpToBillFor}
            onAttachBill={(e) => openUpload(e.id)}
          />
        ) : tab === 'vat-bills' ? (
          <VatBillsView
            bills={vatBills}
            canEdit={canEdit}
            focusExpenseId={vatFocusExpenseId}
            onOpen={(bill) => setVatSheet({ mode: 'view', bill })}
            onDelete={removeBill}
            onUpload={() => openUpload()}
          />
        ) : tab === 'journal' ? (
          <JournalView entries={journal} canEdit={canEdit} onOpen={openEditJournal} />
        ) : tab === 'ledger' ? (
          <AccountLedgerView
            ledgers={cashBankLedgers}
            summaries={summaries}
            canEdit={canEdit}
            onEditOpening={(account, current) => setOpeningSheet({ open: true, account, current })}
          />
        ) : tab === 'bank' ? (
          <BankView transactions={bankTransactions} canEdit={canEdit} onDelete={removeBankTx} />
        ) : tab === 'pnl' ? (
          <PnlView pnl={pnl} purchases={purchases} />
        ) : tab === 'balance-sheet' ? (
          <BalanceSheetView sheet={balanceSheet} />
        ) : tab === 'order-pnl' ? (
          <OrderPnlView
            rows={oplFilteredRows}
            summary={oplSummary}
            labourRate={labourRate}
            filter={oplFilter}
            filterCounts={oplFilterCounts}
            onFilterChange={setOplFilter}
            canEdit={canEdit}
            onOpenCosts={openOplCosts}
          />
        ) : (
          <PurchasesPane showSummary={false} showFab={false} addNonce={purchasesAddNonce} />
        )}
      </ScrollView>

      <AddExpenseSheet
        visible={addOpen}
        draft={draft}
        onClose={() => setAddOpen(false)}
        onChange={(patch) => setDraft((d) => ({ ...d, ...patch }))}
        onSave={handleSaveExpense}
      />

      <JournalSheet
        visible={journalSheetOpen}
        draft={journalDraft}
        accounts={accounts}
        onClose={() => setJournalSheetOpen(false)}
        onChange={(patch) => setJournalDraft((d) => ({ ...d, ...patch }))}
        onSave={handleSaveJournal}
        onDelete={journalDraft.id ? removeJournal : undefined}
      />

      <OpeningBalanceSheet
        visible={openingSheet.open}
        accountName={openingSheet.account}
        current={openingSheet.current}
        onClose={() => setOpeningSheet({ open: false, account: '', current: 0 })}
        onSave={saveOpening}
      />

      <BankTxSheet
        visible={bankSheetOpen}
        draft={bankDraft}
        onClose={() => setBankSheetOpen(false)}
        onChange={(patch) => setBankDraft((d) => ({ ...d, ...patch }))}
        onSave={handleSaveBank}
      />

      <OrderCostsSheet
        visible={oplOrderId !== null}
        order={oplOrder}
        hasRecord={oplHasRecord}
        draft={oplDraft}
        canEdit={canEdit}
        labourRate={labourRate}
        onChange={(patch) => setOplDraft((d) => ({ ...d, ...patch }))}
        onSave={handleSaveOplCosts}
        onClear={handleClearOplCosts}
        onClose={() => setOplOrderId(null)}
      />

      {vatSheet.mode === 'view' && vatSheet.bill ? (
        <VatBillSheet visible mode="view" bill={vatSheet.bill} onClose={() => setVatSheet({ mode: null, bill: null })} onDelete={() => removeBill(vatSheet.bill!)} />
      ) : (
        <VatBillSheet
          visible={vatSheet.mode === 'upload'}
          mode="upload"
          candidates={expenses.filter((e) => !e.vatBill)}
          draft={billDraft}
          onChange={(patch) => setBillDraft((d) => ({ ...d, ...patch }))}
          onSave={handleSaveBill}
          onClose={() => setVatSheet({ mode: null, bill: null })}
        />
      )}

      {canEdit && (tab === 'overview' || tab === 'expenses') ? <FinanceFab label="Add expense" onPress={openAdd} /> : null}
      {canEdit && tab === 'purchases' ? <FinanceFab label="Add purchase" onPress={() => setPurchasesAddNonce((n) => n + 1)} /> : null}
      {canEdit && tab === 'journal' ? <FinanceFab label="Post entry" onPress={openAddJournal} /> : null}
      {canEdit && tab === 'bank' ? <FinanceFab label="Log transaction" onPress={openAddBank} /> : null}
    </View>
  );
}

function FinanceFab({ label, onPress }: { label: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.fab, { backgroundColor: theme.surfaceInverted, boxShadow: theme.scheme === 'light' ? '0 16px 30px -16px rgba(13,31,25,0.85)' : undefined }]}
    >
      <Icon name="plus" size={18} color={theme.onDark.accent} />
      <Text style={[styles.fabLabel, { color: theme.onDark.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  kpiWrap: { paddingBottom: 8 },
  headerAction: { width: 36, height: 36, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, paddingTop: 4, paddingBottom: 110, gap: 12 },
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
