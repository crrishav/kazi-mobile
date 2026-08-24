import type { Account, Client, ClientId, Currency, Invoice, InvoiceStatus, OpenChallan, PaymentMethod } from './types';

/** Design-tool-editable defaults in the source file — pinned here since the mobile app has no settings panel for them. */
export const VAT_RATE = 13;

export const RATES: Record<Currency, number> = { GBP: 150.6, EUR: 132.1, NPR: 1 };
export const SYM: Record<Currency, string> = { GBP: '£', EUR: '€', NPR: 'रु ' };

export const CLIENTS: Record<ClientId, Client> = {
  northfield: { name: 'Northfield Apparel', city: 'Leeds, UK', initials: 'NA', avatarBg: '#E2F6EC', avatarFg: '#0E5E43' },
  halden: { name: 'Halden & Co.', city: 'Manchester, UK', initials: 'HC', avatarBg: '#0D1F19', avatarFg: '#BFE9D5' },
  thamel: { name: 'Thamel Threads', city: 'Kathmandu, NP', initials: 'TT', avatarBg: '#F1EEE5', avatarFg: '#3B4F47' },
  baselayer: { name: 'Base Layer Studio', city: 'Oslo, NO', initials: 'BL', avatarBg: '#F8E7DF', avatarFg: '#8E4327' },
  karve: { name: 'Karve Outdoor', city: 'Bristol, UK', initials: 'KO', avatarBg: '#EDEFEC', avatarFg: '#4A5A53' },
  ridgeline: { name: 'Ridgeline Supply', city: 'Glasgow, UK', initials: 'RS', avatarBg: '#E2F6EC', avatarFg: '#0E5E43' },
};

export const ACCOUNTS: Account[] = [
  { id: 'nic', code: '1020', label: 'NIC Asia 8830' },
  { id: 'hsbc', code: '1025', label: 'HSBC 4471' },
  { id: 'nabil', code: '1027', label: 'Nabil 2210' },
];

export const PILL: Record<InvoiceStatus, { label: string; bg: string; fg: string; dot: string; accent: string }> = {
  accepted: { bg: '#F1EEE5', fg: '#3B4F47', dot: '#8C9A92', label: 'Accepted', accent: '#DCD6C8' },
  collected: { bg: '#E2F6EC', fg: '#0E5E43', dot: '#22A97A', label: 'Collected', accent: '#5FD2A0' },
  cancelled: { bg: '#F8E7DF', fg: '#8E4327', dot: '#C0603C', label: 'Cancelled', accent: '#C0603C' },
};

export const METHODS: { id: PaymentMethod; label: string; badge: string; badgeBg: string; badgeFg: string }[] = [
  { id: 'cash', label: 'Cash', badge: 'CRV', badgeBg: '#F1EEE5', badgeFg: '#3B4F47' },
  { id: 'bank', label: 'Bank', badge: 'BRV', badgeBg: '#E2F6EC', badgeFg: '#0E5E43' },
  { id: 'credit', label: 'Credit', badge: 'CN', badgeBg: '#F7EEDA', badgeFg: '#7A5709' },
];

export const seedInvoices: Invoice[] = [
  {
    id: 'i1042', ref: 'INV-1042', client: 'northfield', cur: 'GBP', rate: 150.0, export: true,
    so: 'SO-2291', issued: '21 Aug', due: '20 Sep', dueDays: 28, terms: '30 days', cancelled: false,
    challans: [{ no: 'DC-0881', meta: '18 Aug · 1,400 pcs' }, { no: 'DC-0884', meta: '21 Aug · 1,000 pcs' }],
    lines: [
      { desc: 'Oversized hoodie · AW26 · black', challan: 'DC-0881', qty: 1400, rate: 12.0 },
      { desc: 'Oversized hoodie · AW26 · ecru', challan: 'DC-0884', qty: 1000, rate: 12.0 },
    ],
    payments: [],
  },
  {
    id: 'i1041', ref: 'INV-1041', client: 'halden', cur: 'GBP', rate: 150.0, export: true,
    so: 'SO-2290', issued: '16 Aug', due: '30 Sep', dueDays: 38, terms: '45 days', cancelled: false,
    challans: [{ no: 'DC-0879', meta: '15 Aug · 5,000 pcs' }],
    lines: [
      { desc: 'Organic cotton tee · white', challan: 'DC-0879', qty: 3000, rate: 4.2 },
      { desc: 'Organic cotton tee · navy', challan: 'DC-0879', qty: 2000, rate: 4.2 },
    ],
    payments: [{ cur: 'GBP', amt: 10500, rate: 150.35, method: 'bank', acct: 'hsbc', ref: 'BRV-0221', date: '20 Aug' }],
  },
  {
    id: 'i1037', ref: 'INV-1037', client: 'ridgeline', cur: 'GBP', rate: 149.5, export: true,
    so: 'SO-2286', issued: '13 Jul', due: '12 Aug', dueDays: -11, terms: '30 days', cancelled: false,
    challans: [{ no: 'DC-0862', meta: '10 Jul · 1,800 pcs' }, { no: 'DC-0866', meta: '12 Jul · 1,400 pcs' }],
    lines: [
      { desc: 'Terry crew sweat · grey marl', challan: 'DC-0862', qty: 1800, rate: 8.9 },
      { desc: 'Terry crew sweat · black', challan: 'DC-0866', qty: 1400, rate: 8.9 },
    ],
    payments: [],
  },
  {
    id: 'i1039', ref: 'INV-1039', client: 'baselayer', cur: 'EUR', rate: 131.8, export: true,
    so: 'SO-2289', issued: '14 Aug', due: '02 Sep', dueDays: 10, terms: 'prepaid', cancelled: false,
    challans: [{ no: 'DC-0874', meta: '13 Aug · 900 pcs' }],
    lines: [
      { desc: 'Merino base layer · charcoal', challan: 'DC-0874', qty: 540, rate: 24.5 },
      { desc: 'Merino base layer · sand', challan: 'DC-0874', qty: 360, rate: 24.5 },
    ],
    payments: [],
  },
  {
    id: 'i1040', ref: 'INV-1040', client: 'thamel', cur: 'NPR', rate: 1, export: false,
    so: 'SO-2287', issued: '15 Aug', due: '15 Aug', dueDays: 0, terms: 'cash on delivery', cancelled: false,
    challans: [{ no: 'DC-0876', meta: '15 Aug · 1,200 pcs' }],
    lines: [{ desc: 'Cotton overshirt · assorted', challan: 'DC-0876', qty: 1200, rate: 700 }],
    payments: [
      { cur: 'NPR', amt: 500000, rate: 1, method: 'bank', acct: 'nic', ref: 'BRV-0219', date: '15 Aug' },
      { cur: 'NPR', amt: 449200, rate: 1, method: 'cash', acct: null, ref: 'CRV-0131', date: '16 Aug' },
    ],
  },
  {
    id: 'i1038', ref: 'INV-1038', client: 'karve', cur: 'GBP', rate: 150.0, export: true,
    so: 'SO-2288', issued: '12 Aug', due: '11 Sep', dueDays: 19, terms: '30 days', cancelled: true,
    cancelNote: 'Cancelled 19 Aug — wrong fabric shipped on DC-0870. Goods returned, re-issued as INV-1044 after re-cut.',
    challans: [{ no: 'DC-0870', meta: '11 Aug · 1,800 pcs' }],
    lines: [{ desc: 'Fleece jogger · heather', challan: 'DC-0870', qty: 1800, rate: 8.0 }],
    payments: [],
  },
  {
    id: 'i1035', ref: 'INV-1035', client: 'halden', cur: 'GBP', rate: 150.6, export: true,
    so: 'SO-2283', issued: '04 Aug', due: '18 Sep', dueDays: 26, terms: '45 days', cancelled: false,
    challans: [{ no: 'DC-0851', meta: '02 Aug · 560 pcs' }],
    lines: [{ desc: 'Cropped tee · SS27 sample run', challan: 'DC-0851', qty: 560, rate: 5.0 }],
    payments: [{ cur: 'GBP', amt: 2800, rate: 150.6, method: 'bank', acct: 'hsbc', ref: 'BRV-0212', date: '09 Aug' }],
  },
  {
    id: 'i1033', ref: 'INV-1033', client: 'northfield', cur: 'GBP', rate: 149.8, export: true,
    so: 'SO-2281', issued: '28 Jul', due: '27 Aug', dueDays: 4, terms: '30 days', cancelled: false,
    challans: [{ no: 'DC-0840', meta: '26 Jul · 1,500 pcs' }],
    lines: [{ desc: 'Zip-through hoodie · navy', challan: 'DC-0840', qty: 1500, rate: 12.0 }],
    payments: [{ cur: 'GBP', amt: 18000, rate: 149.9, method: 'bank', acct: 'nic', ref: 'BRV-0208', date: '20 Aug' }],
  },
];

export const seedOpenChallans: OpenChallan[] = [
  { id: 'k1', no: 'DC-0886', client: 'northfield', pcs: 900, date: '22 Aug', so: 'SO-2291', cur: 'GBP', rate: 12.0, desc: 'Oversized hoodie · AW26 · ecru' },
  { id: 'k2', no: 'DC-0885', client: 'thamel', pcs: 400, date: '22 Aug', so: 'SO-2287', cur: 'NPR', rate: 700, desc: 'Cotton overshirt · assorted' },
  { id: 'k3', no: 'DC-0883', client: 'baselayer', pcs: 300, date: '20 Aug', so: 'SO-2289', cur: 'EUR', rate: 24.5, desc: 'Merino base layer · sand' },
];
