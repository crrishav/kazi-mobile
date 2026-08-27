import type { LibraryItem, StockItem, StockMovement } from './types';

const daysAgoISO = (n: number) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);

export const seedStock: StockItem[] = [
  { id: 's1', name: 'Anti-Grunge Cotton', sku: 'FAB-AGC-180', supplier: 'Sunrise Mills', qty: 420, threshold: 900, unit: 'm', swatch: '#DCD6C8', swatchFg: '#3B4F47', swatchLabel: '180 GSM', lead: '12 days', location: 'Rack B2', cost: 'NPR 310/m', batches: '3 batches waiting' },
  { id: 's2', name: 'AP Cotton', sku: 'FAB-APC-160', supplier: 'Sunrise Mills', qty: 1040, threshold: 1200, unit: 'm', swatch: '#E7E9E2', swatchFg: '#3B4F47', swatchLabel: '160 GSM', lead: '12 days', location: 'Rack B4', cost: 'NPR 268/m', batches: '1 batch waiting' },
  { id: 's3', name: 'Terry Fleece · Ink', sku: 'FAB-TFI-320', supplier: 'Bagmati Knits', qty: 2680, threshold: 1500, unit: 'm', swatch: '#2C3B34', swatchFg: '#BFE9D5', swatchLabel: '320 GSM', lead: '18 days', location: 'Rack C1', cost: 'NPR 540/m', batches: '—' },
  { id: 's4', name: 'Merino Jersey 19.5µ', sku: 'FAB-MRJ-195', supplier: 'Highland Yarn (UK)', qty: 310, threshold: 400, unit: 'm', swatch: '#C8B9A4', swatchFg: '#3B4F47', swatchLabel: '19.5µ', lead: '26 days', location: 'Rack A3', cost: 'GBP 14.20/m', batches: '1 batch waiting' },
  { id: 's5', name: 'Ribbed Collar Tape', sku: 'TRM-RCT-020', supplier: 'Kathmandu Trims', qty: 8400, threshold: 3000, unit: 'm', swatch: '#B7CBBE', swatchFg: '#0F241D', swatchLabel: '2 cm', lead: '6 days', location: 'Bin 14', cost: 'NPR 22/m', batches: '—' },
  { id: 's6', name: 'Recycled Poly Zips', sku: 'TRM-RPZ-045', supplier: 'Kathmandu Trims', qty: 1250, threshold: 2000, unit: 'pcs', swatch: '#8C9A92', swatchFg: '#F7F4EC', swatchLabel: '45 cm', lead: '9 days', location: 'Bin 07', cost: 'NPR 46/pc', batches: '2 batches waiting' },
  { id: 's7', name: 'Woven Care Labels', sku: 'TRM-WCL-001', supplier: 'Print House KTM', qty: 26400, threshold: 10000, unit: 'pcs', swatch: '#F1EEE5', swatchFg: '#3B4F47', swatchLabel: 'SATIN', lead: '5 days', location: 'Bin 02', cost: 'NPR 3/pc', batches: '—' },
];

export const seedLibrary: LibraryItem[] = [
  { id: 'l1', group: 'Sketches', kind: 'AI', name: 'Oversized hoodie · AW26', meta: 'v4 · 12 Aug · Sabina R.', tags: ['Hoodie', 'AW26'] },
  { id: 'l2', group: 'Sketches', kind: 'PDF', name: 'Cropped tee placket study', meta: 'v2 · 04 Aug · Sabina R.', tags: ['Tee', 'SS27'] },
  { id: 'l3', group: 'Sketches', kind: 'AI', name: 'Jogger taper revision', meta: 'v7 · 28 Jul · Milan K.', tags: ['Jogger'] },
  { id: 'l4', group: 'Specs & tech packs', kind: 'XLS', name: 'Tech pack · BATCH-118', meta: 'Locked · 18 Aug', tags: ['Hoodie', 'Locked'] },
  { id: 'l5', group: 'Specs & tech packs', kind: 'PDF', name: 'Measurement chart · UK sizing', meta: 'v3 · 15 Aug', tags: ['Sizing'] },
  { id: 'l6', group: 'Specs & tech packs', kind: 'PDF', name: 'Anti-Grunge Cotton datasheet', meta: 'Supplier doc · 02 Jul', tags: ['Fabric'] },
  { id: 'l7', group: 'Lab dips & approvals', kind: 'IMG', name: 'Lab dip · Ink green 04', meta: 'Approved · 09 Aug', tags: ['Approved'] },
  { id: 'l8', group: 'Lab dips & approvals', kind: 'IMG', name: 'Wash test · terry fleece', meta: 'Pending · 20 Aug', tags: ['Pending'] },
];

export const stockHistory: number[] = [96, 94, 91, 88, 84, 79, 74, 70, 63, 58, 52, 47, 41, 38, 34, 31, 28, 24, 21, 19];

/** Per-item stock ledger (item 19), newest first. Balance is the running qty after each move. */
export const seedMovements: StockMovement[] = [
  { id: 'm1', itemId: 's1', kind: 'out', delta: -280, balance: 420, reason: 'Issued to cutting', ref: 'BATCH-119 · Bimal S.', date: daysAgoISO(1) },
  { id: 'm2', itemId: 's1', kind: 'out', delta: -340, balance: 700, reason: 'Issued to cutting', ref: 'BATCH-118 · Bimal S.', date: daysAgoISO(4) },
  { id: 'm3', itemId: 's1', kind: 'out', delta: -45, balance: 1040, reason: 'Wastage written off', ref: 'QC fail · shade variance', date: daysAgoISO(6) },
  { id: 'm4', itemId: 's2', kind: 'in', delta: 600, balance: 1040, reason: 'GRN received', ref: 'PO-2418 · Sunrise Mills', date: daysAgoISO(3) },
  { id: 'm5', itemId: 's2', kind: 'out', delta: -60, balance: 440, reason: 'Issued to sampling', ref: 'SAMP-77 · Sabina R.', date: daysAgoISO(8) },
  { id: 'm6', itemId: 's4', kind: 'adjust', delta: -12, balance: 310, reason: 'Cycle count correction', ref: 'STK-COUNT Aug', date: daysAgoISO(2) },
];
