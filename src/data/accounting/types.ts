export type AccountSide = 'debit' | 'credit';
export type ChartNodeKind = 'group' | 'leaf';
export type AccountingView = 'sheet' | 'ledger';
export type EntryMode = 'journal' | 'bank';
export type BankDirection = 'in' | 'out';

export interface ChartNode {
  id: string;
  kind: ChartNodeKind;
  code?: string;
  label: string;
  /** Nesting level for a group (0 = top-level). Not set on leaves — they always sit at their parent's indent. */
  depth?: number;
  side: AccountSide;
  parent?: string;
  /** Base balance for a leaf account. Undefined for groups — their total is derived from children. */
  amount?: number;
}

export interface ExpenseAccount {
  id: string;
  code: string;
  label: string;
  amount: number;
}

export interface LedgerEntry {
  memo: string;
  meta: string;
  debit: number;
  credit: number;
}

export interface EntryDraft {
  amount: string;
  debitAcct: string;
  creditAcct: string;
  direction: BankDirection;
  memo: string;
}
