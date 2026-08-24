export type ExpenseCategoryId = 'power' | 'wages' | 'freight' | 'rent' | 'repairs' | 'admin';

export interface ExpenseCategory {
  id: ExpenseCategoryId;
  label: string;
  tag: string;
  bg: string;
  fg: string;
}

export type ExpenseStatus = 'paid' | 'unpaid';

export interface Expense {
  id: string;
  cat: ExpenseCategoryId;
  name: string;
  meta: string;
  amount: number;
  status: ExpenseStatus;
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

export type LedgerRowType = 'bank' | 'journal' | 'expense';

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

export type ExpenseSource = 'Cash' | 'Bank' | 'Payable';
