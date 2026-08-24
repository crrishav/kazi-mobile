import type { PurchaseEntry, PurchaseStatus } from './types';

export const STATUS: Record<PurchaseStatus, { label: string; dot: string; bg: string; fg: string; accent: string }> = {
  paid: { label: 'Paid', dot: '#22A97A', bg: '#E2F6EC', fg: '#0E5E43', accent: '#FFFFFF' },
  partial: { label: 'Partial', dot: '#B98514', bg: '#F7EEDA', fg: '#7A5709', accent: '#B98514' },
  unpaid: { label: 'Unpaid', dot: '#C0603C', bg: '#F8E7DF', fg: '#8E4327', accent: '#C0603C' },
};

export const SUPPLIERS = ['Sunrise Mills', 'Kathmandu Trims', 'Bagmati Knits', 'Print House KTM', 'Highland Yarn (UK)'];

export const DAY_LABEL: Record<string, string> = {
  '2026-08-23': 'Today · 23 Aug',
  '2026-08-22': 'Yesterday · 22 Aug',
  '2026-08-21': 'Friday · 21 Aug',
  '2026-08-20': 'Thursday · 20 Aug',
  '2026-08-19': 'Wednesday · 19 Aug',
  '2026-08-18': 'Tuesday · 18 Aug',
};

export const seedEntries: PurchaseEntry[] = [
  { id: 'p1', ref: 'PUR-0412', supplier: 'Sunrise Mills', item: 'Anti-Grunge Cotton', qty: '600 m @ 310', amount: 186000, method: 'Bank', status: 'unpaid', date: '2026-08-23', due: '07 Sep', grn: 'GRN-1188', bill: 'Not attached', lines: [{ name: 'Anti-Grunge Cotton 180 GSM', qty: '600 m @ NPR 310', value: '186,000' }] },
  { id: 'p2', ref: 'PUR-0411', supplier: 'Kathmandu Trims', item: 'Recycled poly zips', qty: '3,000 pcs @ 46', amount: 138000, method: 'Cash', status: 'paid', date: '2026-08-23', due: '—', grn: 'GRN-1187', bill: 'IMG · 23 Aug', lines: [{ name: 'Recycled poly zips 45 cm', qty: '3,000 pcs @ NPR 46', value: '138,000' }] },
  { id: 'p3', ref: 'PUR-0410', supplier: 'Print House KTM', item: 'Woven care labels', qty: '20,000 pcs @ 3', amount: 60000, method: 'Cash', status: 'paid', date: '2026-08-22', due: '—', grn: 'GRN-1186', bill: 'IMG · 22 Aug', lines: [{ name: 'Woven care labels · satin', qty: '20,000 pcs @ NPR 3', value: '60,000' }] },
  { id: 'p4', ref: 'PUR-0409', supplier: 'Bagmati Knits', item: 'Terry fleece · ink', qty: '1,200 m @ 540', amount: 648000, method: 'Bank', status: 'partial', date: '2026-08-21', due: '05 Sep', grn: 'GRN-1184', bill: 'PDF · 21 Aug', lines: [{ name: 'Terry fleece 320 GSM · ink', qty: '1,200 m @ NPR 540', value: '648,000' }] },
  { id: 'p5', ref: 'PUR-0408', supplier: 'Sunrise Mills', item: 'AP Cotton', qty: '900 m @ 268', amount: 241200, method: 'Bank', status: 'paid', date: '2026-08-20', due: '—', grn: 'GRN-1181', bill: 'PDF · 20 Aug', lines: [{ name: 'AP Cotton 160 GSM', qty: '900 m @ NPR 268', value: '241,200' }] },
  { id: 'p6', ref: 'PUR-0407', supplier: 'Kathmandu Trims', item: 'Ribbed collar tape', qty: '4,000 m @ 22', amount: 88000, method: 'Cash', status: 'unpaid', date: '2026-08-19', due: '02 Sep', grn: 'GRN-1179', bill: 'Not attached', lines: [{ name: 'Ribbed collar tape 2 cm', qty: '4,000 m @ NPR 22', value: '88,000' }] },
  { id: 'p7', ref: 'PUR-0406', supplier: 'Highland Yarn (UK)', item: 'Merino jersey 19.5µ', qty: '400 m @ 1,890', amount: 756000, method: 'Bank', status: 'paid', date: '2026-08-18', due: '—', grn: 'GRN-1176', bill: 'PDF · 18 Aug', lines: [{ name: 'Merino jersey 19.5µ', qty: '400 m @ NPR 1,890', value: '756,000' }] },
  { id: 'p8', ref: 'PUR-0405', supplier: 'Print House KTM', item: 'Hangtags · AW26', qty: '8,000 pcs @ 7', amount: 56000, method: 'Cash', status: 'paid', date: '2026-08-18', due: '—', grn: 'GRN-1175', bill: 'IMG · 18 Aug', lines: [{ name: 'Hangtags · AW26 recycled board', qty: '8,000 pcs @ NPR 7', value: '56,000' }] },
];
