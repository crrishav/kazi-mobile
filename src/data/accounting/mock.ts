import type { ChartNode, ExpenseAccount, LedgerEntry } from './types';

/** The equity account that absorbs P&L movement whenever an entry's leg touches an expense account. */
export const PROFIT_ACCOUNT_ID = 'e3030';

export const CHART: ChartNode[] = [
  { id: 'assets', kind: 'group', label: 'Assets', depth: 0, side: 'debit' },
  { id: 'ca', kind: 'group', label: 'Current assets', depth: 1, side: 'debit', parent: 'assets' },
  { id: 'a1010', kind: 'leaf', code: '1010', label: 'Cash in hand', amount: 1284500, side: 'debit', parent: 'ca' },
  { id: 'a1020', kind: 'leaf', code: '1020', label: 'Bank · NIC Asia 8830', amount: 8942000, side: 'debit', parent: 'ca' },
  { id: 'a1025', kind: 'leaf', code: '1025', label: 'Bank · HSBC 4471', amount: 4310600, side: 'debit', parent: 'ca' },
  { id: 'a1100', kind: 'leaf', code: '1100', label: 'Accounts receivable', amount: 13360000, side: 'debit', parent: 'ca' },
  { id: 'a1200', kind: 'leaf', code: '1200', label: 'Inventory · raw material', amount: 9180000, side: 'debit', parent: 'ca' },
  { id: 'a1210', kind: 'leaf', code: '1210', label: 'Inventory · work in progress', amount: 3640000, side: 'debit', parent: 'ca' },
  { id: 'a1220', kind: 'leaf', code: '1220', label: 'Inventory · finished goods', amount: 2470000, side: 'debit', parent: 'ca' },
  { id: 'a1300', kind: 'leaf', code: '1300', label: 'Advances to suppliers', amount: 1150000, side: 'debit', parent: 'ca' },
  { id: 'nca', kind: 'group', label: 'Non-current assets', depth: 1, side: 'debit', parent: 'assets' },
  { id: 'a1500', kind: 'leaf', code: '1500', label: 'Equipment & machinery', amount: 24600000, side: 'debit', parent: 'nca' },
  { id: 'a1510', kind: 'leaf', code: '1510', label: 'Less: accum. depreciation', amount: -7840000, side: 'debit', parent: 'nca' },
  { id: 'a1600', kind: 'leaf', code: '1600', label: 'Factory fit-out', amount: 5200000, side: 'debit', parent: 'nca' },
  { id: 'a1700', kind: 'leaf', code: '1700', label: 'Vehicles', amount: 3100000, side: 'debit', parent: 'nca' },

  { id: 'liab', kind: 'group', label: 'Liabilities', depth: 0, side: 'credit' },
  { id: 'cl', kind: 'group', label: 'Current liabilities', depth: 1, side: 'credit', parent: 'liab' },
  { id: 'l2010', kind: 'leaf', code: '2010', label: 'Accounts payable', amount: 9240000, side: 'credit', parent: 'cl' },
  { id: 'l2020', kind: 'leaf', code: '2020', label: 'Accrued wages', amount: 2860000, side: 'credit', parent: 'cl' },
  { id: 'l2030', kind: 'leaf', code: '2030', label: 'VAT payable', amount: 1145000, side: 'credit', parent: 'cl' },
  { id: 'l2040', kind: 'leaf', code: '2040', label: 'Customer advances', amount: 4176000, side: 'credit', parent: 'cl' },
  { id: 'ncl', kind: 'group', label: 'Non-current liabilities', depth: 1, side: 'credit', parent: 'liab' },
  { id: 'l2500', kind: 'leaf', code: '2500', label: 'Term loan · NIC Asia', amount: 12000000, side: 'credit', parent: 'ncl' },

  { id: 'eq', kind: 'group', label: 'Equity', depth: 0, side: 'credit' },
  { id: 'e3010', kind: 'leaf', code: '3010', label: 'Share capital', amount: 15000000, side: 'credit', parent: 'eq' },
  { id: 'e3020', kind: 'leaf', code: '3020', label: 'Retained earnings', amount: 18462100, side: 'credit', parent: 'eq' },
  { id: PROFIT_ACCOUNT_ID, kind: 'leaf', code: '3030', label: 'Profit for the year', amount: 6514000, side: 'credit', parent: 'eq' },
];

export const EXPENSE_ACCOUNTS: ExpenseAccount[] = [
  { id: 'x5010', code: '5010', label: 'Wages & overtime', amount: 41800000 },
  { id: 'x5020', code: '5020', label: 'Freight & logistics', amount: 3940000 },
  { id: 'x5030', code: '5030', label: 'Power & utilities', amount: 2412000 },
  { id: 'x5040', code: '5040', label: 'Rent · godown & factory', amount: 2340000 },
  { id: 'x5050', code: '5050', label: 'Depreciation', amount: 1568000 },
  { id: 'x5060', code: '5060', label: 'Repairs & maintenance', amount: 1180000 },
];

export const LEDGERS: Record<string, LedgerEntry[]> = {
  a1020: [
    { memo: 'Halden & Co. · invoice settled', meta: '12 Bhadra · SO-2290 · BRV-0221', debit: 3150000, credit: 0 },
    { memo: 'Payroll run · 214 staff', meta: '10 Bhadra · BPV-0418', debit: 0, credit: 4180000 },
    { memo: 'Sunrise Mills · PUR-0412', meta: '08 Bhadra · BPV-0417', debit: 0, credit: 186000 },
    { memo: 'Northfield Apparel · advance', meta: '04 Bhadra · SO-2291 · BRV-0219', debit: 1296000, credit: 0 },
    { memo: 'NEA electricity · Bhadra', meta: '02 Bhadra · BPV-0414', debit: 0, credit: 214500 },
  ],
  a1010: [
    { memo: 'Cash purchase · collar tape', meta: '11 Bhadra · CPV-0331', debit: 0, credit: 88000 },
    { memo: 'Withdrawal from NIC Asia', meta: '09 Bhadra · CRV-0128', debit: 500000, credit: 0 },
    { memo: 'Customs agent fee', meta: '05 Bhadra · CPV-0329', debit: 0, credit: 62000 },
  ],
  x5050: [
    { memo: 'Depreciation · machinery', meta: '30 Bhadra · JV-0331', debit: 128000, credit: 0 },
    { memo: 'Depreciation · vehicles', meta: '30 Bhadra · JV-0332', debit: 42000, credit: 0 },
    { memo: 'Depreciation · fit-out', meta: '30 Shrawan · JV-0319', debit: 26000, credit: 0 },
  ],
};

export const DEFAULT_LEDGER: LedgerEntry[] = [
  { memo: 'Opening entry · year start', meta: '01 Shrawan · JV-0301', debit: 0, credit: 0 },
  { memo: 'Monthly accrual', meta: '30 Shrawan · JV-0320', debit: 0, credit: 0 },
];

/** Quick-pick account chips offered in the log-entry sheet's debit/credit rows. */
export const PICKS = ['a1010', 'a1020', 'a1025', 'a1100', 'a1500', 'l2010', 'l2020', 'x5050', 'x5060', 'x5020'];

export const DEFAULT_OPEN: Record<string, boolean> = {
  assets: true, ca: true, nca: true, liab: true, cl: true, ncl: false, eq: true,
};
