import type { Expense, ExpenseCategory, FiscalYear, LedgerMonth } from './types';

export const CATEGORIES: ExpenseCategory[] = [
  { id: 'power', label: 'Power', tag: 'PWR', bg: '#F7EEDA', fg: '#7A5709' },
  { id: 'wages', label: 'Wages', tag: 'WAG', bg: '#E2F6EC', fg: '#0E5E43' },
  { id: 'freight', label: 'Freight', tag: 'FRT', bg: '#E9EFEC', fg: '#147A57' },
  { id: 'rent', label: 'Rent', tag: 'RNT', bg: '#F1EEE5', fg: '#3B4F47' },
  { id: 'repairs', label: 'Repairs', tag: 'REP', bg: '#F8E7DF', fg: '#8E4327' },
  { id: 'admin', label: 'Admin', tag: 'ADM', bg: '#EDEAE0', fg: '#5B6C64' },
];

export const seedExpenses: Expense[] = [
  { id: 'e1', cat: 'power', name: 'NEA electricity · Aug', meta: 'Bill 44112 · bank transfer', amount: 214500, status: 'paid' },
  { id: 'e2', cat: 'freight', name: 'Air freight · SO-2290', meta: 'Halden & Co. · DHL', amount: 486000, status: 'paid' },
  { id: 'e3', cat: 'repairs', name: 'Overlock service · 6 heads', meta: 'Juki technician · 2 days', amount: 78000, status: 'unpaid' },
  { id: 'e4', cat: 'wages', name: 'Overtime · finishing line', meta: '38 workers · week 33', amount: 342000, status: 'paid' },
  { id: 'e5', cat: 'rent', name: 'Godown rent · Balaju', meta: 'Bhadra · 4,200 sq ft', amount: 195000, status: 'paid' },
  { id: 'e6', cat: 'admin', name: 'Customs agent fee', meta: '3 consignments', amount: 62000, status: 'unpaid' },
];

export const YEARS: FiscalYear[] = [
  { id: 'fy8283', label: 'FY 2082/83', range: 'Shrawan 2082 – Ashad 2083 · Jul 2025 – Jul 2026', turnover: 'रु 18.4Cr', margin: '22.4%', entries: 1284, current: true },
  { id: 'fy8182', label: 'FY 2081/82', range: 'Shrawan 2081 – Ashad 2082 · Jul 2024 – Jul 2025', turnover: 'रु 15.1Cr', margin: '19.8%', entries: 1147, current: false },
  { id: 'fy8081', label: 'FY 2080/81', range: 'Shrawan 2080 – Ashad 2081 · Jul 2023 – Jul 2024', turnover: 'रु 12.6Cr', margin: '17.2%', entries: 968, current: false },
  { id: 'fy7980', label: 'FY 2079/80', range: 'Shrawan 2079 – Ashad 2080 · Jul 2022 – Jul 2023', turnover: 'रु 9.8Cr', margin: '15.9%', entries: 742, current: false },
];

export const LEDGER: Record<string, LedgerMonth[]> = {
  fy8283: [
    {
      month: 'Bhadra',
      gregorian: 'Aug – Sep 2026',
      rows: [
        { type: 'bank', title: 'Halden & Co. · invoice settled', meta: 'HSBC 4471 · SO-2290', amount: 3150000, dir: 'in' },
        { type: 'expense', title: 'Air freight · DHL', meta: 'FRT · SO-2290', amount: 486000, dir: 'out' },
        { type: 'journal', title: 'Depreciation · machinery', meta: 'JV-0331 · monthly', amount: 128000, dir: 'out' },
        { type: 'bank', title: 'Sunrise Mills · PUR-0412', meta: 'NIC Asia 8830 · bank', amount: 186000, dir: 'out' },
        { type: 'expense', title: 'NEA electricity', meta: 'PWR · bill 44112', amount: 214500, dir: 'out' },
      ],
    },
    {
      month: 'Shrawan',
      gregorian: 'Jul – Aug 2026',
      rows: [
        { type: 'bank', title: 'Northfield Apparel · advance', meta: 'HSBC 4471 · SO-2291', amount: 1296000, dir: 'in' },
        { type: 'journal', title: 'Opening stock revaluation', meta: 'JV-0318 · year start', amount: 402000, dir: 'in' },
        { type: 'expense', title: 'Godown rent · Balaju', meta: 'RNT · Shrawan', amount: 195000, dir: 'out' },
        { type: 'bank', title: 'Payroll run · 214 staff', meta: 'NIC Asia 8830 · salary', amount: 4180000, dir: 'out' },
        { type: 'expense', title: 'Boiler repair', meta: 'REP · steam line', amount: 96000, dir: 'out' },
      ],
    },
    {
      month: 'Ashad',
      gregorian: 'Jun – Jul 2026',
      rows: [
        { type: 'journal', title: 'Year-end accrual · audit fee', meta: 'JV-0309 · provision', amount: 240000, dir: 'out' },
        { type: 'bank', title: 'Base Layer Studio · prepaid', meta: 'HSBC 4471 · SO-2289', amount: 2880000, dir: 'in' },
        { type: 'expense', title: 'Customs agent fee', meta: 'ADM · 5 consignments', amount: 104000, dir: 'out' },
      ],
    },
  ],
};

export const MARGINS: number[] = [18.2, 19.4, 17.8, 21.0, 20.2, 22.6, 23.4, 21.8, 24.1, 22.9, 23.8, 24.6];
