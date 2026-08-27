export type ExpenseCategoryId = 'power' | 'wages' | 'freight' | 'rent' | 'repairs' | 'admin';

export interface ExpenseCategory {
  id: ExpenseCategoryId;
  label: string;
  tag: string;
  bg: string;
  fg: string;
}

/** Matches the live `finance_expenses.status` ("Paid") — mobile also tracks the unpaid side. */
export type ExpenseStatus = 'Paid' | 'Unpaid';

/** Where an expense is settled from. `Payable` = booked but not yet paid. */
export type ExpenseSource = 'Cash' | 'Bank' | 'Payable';

/**
 * Shape mirrors the live `finance_expenses` collection (`category`, `amountNPR`,
 * `date`, `note`, `vatBill`, `status`, `loggedBy`). `name` is the row's display
 * title; `meta` is derived on screen from `source`/`loggedBy` (no longer stored).
 */
export interface Expense {
  id: string;
  category: ExpenseCategoryId;
  name: string;
  note: string;
  amountNPR: number;
  /** AD ISO date, `YYYY-MM-DD`. BS is derived for display. */
  date: string;
  source: ExpenseSource;
  vatBill: boolean;
  status: ExpenseStatus;
  loggedBy: string;
}

export type VatBillKind = 'image' | 'pdf';

/**
 * A VAT bill scan linked to an expense. The reference stores these in Firebase
 * Storage + a `vat_bills` doc; mock-era we keep a file name and kind only.
 */
export interface VatBill {
  id: string;
  expenseId: string;
  /** Snapshot of the linked expense's title, so the list reads without a join. */
  item: string;
  fileName: string;
  kind: VatBillKind;
  uploadedBy: string;
  /** AD ISO date. */
  date: string;
}

export interface FiscalYear {
  id: string;
  label: string;
  range: string;
  turnover: string;
  margin: string;
  entries: number;
  current: boolean;
}

// ---- Chart of accounts + journal (item 8) ----

export type AccountType = 'Asset' | 'Liability' | 'Equity' | 'Income' | 'Expense';

/**
 * Mirrors the live `accounts` collection (`name`, `type`) plus an
 * `openingBalanceNPR` the reference backfills in code — mobile stores it.
 */
export interface Account {
  id: string;
  name: string;
  type: AccountType;
  openingBalanceNPR: number;
}

/** Mirrors `journal_entries` (`date`, `description`, `debitAccount`, `creditAccount`, `amountNPR`, `reference`). */
export interface JournalEntry {
  id: string;
  /** AD ISO. */
  date: string;
  description: string;
  /** Account *name* (matches how the live docs store it). */
  debitAccount: string;
  creditAccount: string;
  amountNPR: number;
  reference: string;
  /** Required when either leg is an advance account. */
  partyName?: string;
  createdBy: string;
}

// ---- Bank transactions (item 10) ----

/** Statement convention: `Credit` = money in, `Debit` = money out (mirrors the live `bank_transactions.type`). */
export type BankDirection = 'Credit' | 'Debit';

export interface BankTransaction {
  id: string;
  /** Account name — a `Bank - …` from the chart, or a free-text "Other". */
  bankAccount: string;
  /** AD ISO date. */
  date: string;
  description: string;
  amountNPR: number;
  direction: BankDirection;
  category: string;
  reference: string;
  loggedBy: string;
}

// ---- Order P&L (item 11) ----

/**
 * Per-order cost breakdown for the Order P&L tab. Keyed by the order id.
 * Mirrors the (design-intent, not yet live) `order_costs` collection —
 * `{ orderId, material, labour, overhead, shipping, updatedAt }`. Once a
 * record exists, all four figures are explicit; the auto labour rate only
 * pre-fills the sheet / shows in the table for orders with no record yet.
 */
export interface OrderCosts {
  orderId: string;
  material: number;
  labour: number;
  overhead: number;
  shipping: number;
  updatedBy: string;
  /** AD ISO date. */
  updatedAt: string;
}

/** Fiscal-Year Transactions drill covers 6 sources (item 18 / reference `FiscalYearTransactions.jsx`). */
export type LedgerRowType = 'bank' | 'journal' | 'expense' | 'purchase' | 'payroll' | 'sales';

export interface LedgerRow {
  type: LedgerRowType;
  title: string;
  meta: string;
  amount: number;
  dir: 'in' | 'out';
}

export interface LedgerMonth {
  month: string;
  gregorian: string;
  rows: LedgerRow[];
}
