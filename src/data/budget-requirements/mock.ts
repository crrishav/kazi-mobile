import type { Category, Priority, RequestStatus, Requirement } from './types';

export const STATUS: Record<RequestStatus, { label: string; dot: string; bg: string; fg: string; accent: string }> = {
  pending: { label: 'Pending', dot: '#B98514', bg: '#F7EEDA', fg: '#7A5709', accent: '#B98514' },
  approved: { label: 'Approved', dot: '#22A97A', bg: '#E2F6EC', fg: '#0E5E43', accent: '#FFFFFF' },
  declined: { label: 'Declined', dot: '#C0603C', bg: '#F8E7DF', fg: '#8E4327', accent: '#C0603C' },
};

export const PRIORITY: Record<Priority, { rank: number; hue: string }> = {
  Low: { rank: 1, hue: '#8A9A92' },
  Medium: { rank: 2, hue: '#B98514' },
  High: { rank: 3, hue: '#C0603C' },
};

export const CATEGORY: Record<Category, { mark: string; bg: string; fg: string }> = {
  Machinery: { mark: '#0D1F19', bg: '#E9EFEC', fg: '#147A57' },
  Equipment: { mark: '#147A57', bg: '#E2F6EC', fg: '#0E5E43' },
  Materials: { mark: '#B98514', bg: '#F7EEDA', fg: '#7A5709' },
  'Office supplies': { mark: '#8A9A92', bg: '#F1EEE5', fg: '#5B6C64' },
};

export const CAP = 800000;

export const seedRequirements: Requirement[] = [
  { id: 'r1', ref: 'REQ-0184', item: 'Bartack machine head', cat: 'Machinery', amount: 245000, priority: 'High', status: 'pending', who: 'Ramesh B.', init: 'RB', team: 'Line 2 · Sewing', date: '23 Aug', by: 'This week', quote: 'Not attached', note: 'Line 2 bartack has been down since Thursday. We are renting a head at रु 4,800/day, so the buy pays for itself in eight weeks. Vendor holds one in stock in Balaju.' },
  { id: 'r2', ref: 'REQ-0183', item: 'Cutting table LED strips', cat: 'Equipment', amount: 38500, priority: 'Medium', status: 'pending', who: 'Sita R.', init: 'SR', team: 'Cutting', date: '23 Aug', by: 'This month', quote: 'PDF · 23 Aug', note: 'Two of the six bays are lit by a single tube. Cutters are marking by phone torch on dark fabric, which is showing up as QC notches on the AW26 fleece.' },
  { id: 'r3', ref: 'REQ-0182', item: 'Fusible interlining · 400 m', cat: 'Materials', amount: 92000, priority: 'High', status: 'pending', who: 'Prakash T.', init: 'PT', team: 'Store', date: '22 Aug', by: 'This week', quote: 'PDF · 22 Aug', note: 'Collar fusing for PO-2291 needs 380 m and we hold 60 m. Without it the hoodie order stops at collar stage on Tuesday.' },
  { id: 'r4', ref: 'REQ-0181', item: 'Needle stock · DBx1 #11', cat: 'Materials', amount: 14200, priority: 'Low', status: 'approved', who: 'Bindu S.', init: 'BS', team: 'Sewing', date: '22 Aug', by: 'This month', quote: 'IMG · 22 Aug', note: 'Routine top-up — six months of breakage cover across all three lines.' },
  { id: 'r5', ref: 'REQ-0180', item: 'Steam irons × 2', cat: 'Equipment', amount: 56000, priority: 'Medium', status: 'approved', who: 'Ramesh B.', init: 'RB', team: 'Finishing', date: '21 Aug', by: 'This month', quote: 'PDF · 21 Aug', note: 'Finishing runs four irons for three tables; two are leaking and staining light shells.' },
  { id: 'r6', ref: 'REQ-0179', item: 'Overlock spare parts kit', cat: 'Machinery', amount: 31400, priority: 'Medium', status: 'approved', who: 'Anita K.', init: 'AK', team: 'Maintenance', date: '20 Aug', by: 'Next month', quote: 'PDF · 20 Aug', note: 'Loopers and knives for the four Juki overlocks so a breakdown is an hour, not a day.' },
  { id: 'r7', ref: 'REQ-0178', item: 'Printer toner + box files', cat: 'Office supplies', amount: 8900, priority: 'Low', status: 'approved', who: 'Anita K.', init: 'AK', team: 'Office', date: '20 Aug', by: 'This month', quote: 'IMG · 20 Aug', note: 'Challan printing for despatch, plus filing for the VAT quarter.' },
  { id: 'r8', ref: 'REQ-0177', item: 'Safety gloves · 50 pairs', cat: 'Equipment', amount: 12000, priority: 'Low', status: 'approved', who: 'Sita R.', init: 'SR', team: 'Cutting', date: '19 Aug', by: 'This week', quote: 'IMG · 19 Aug', note: 'Cut-resistant gloves for the band knife station — the current set is past its wear date.' },
];
