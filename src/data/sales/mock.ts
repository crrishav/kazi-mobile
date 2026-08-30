import type { AvatarTint } from '@/components/ui/avatar';
import type { Order, OrderPriority, Stage, StageHistoryEntry, StageId } from './types';

export const STAGES: Stage[] = [
  { id: 'sourcing', label: 'Fabric Sourcing', short: 'Sourcing', dot: '#8C9A92', bg: '#F1EEE5', fg: '#3B4F47', bar: '#B7BFB9' },
  { id: 'cutting', label: 'Cutting', short: 'Cutting', dot: '#B98514', bg: '#F7EEDA', fg: '#7A5709', bar: '#DBB55C' },
  { id: 'finishing', label: 'Finishing & Pressing', short: 'Finishing', dot: '#147A57', bg: '#E9EFEC', fg: '#0E5E43', bar: '#7FC9A9' },
  { id: 'packing', label: 'Packing', short: 'Packing', dot: '#22A97A', bg: '#E2F6EC', fg: '#0E5E43', bar: '#5FD2A0' },
  { id: 'delivered', label: 'Delivered', short: 'Delivered', dot: '#0D1F19', bg: '#DDE5E0', fg: '#0F241D', bar: '#0D1F19' },
];

export const STAGE_IDS: StageId[] = STAGES.map((s) => s.id);
export const stageIndex = (id: StageId) => STAGE_IDS.indexOf(id);

/** Row avatars cycle through these tints by row position, matching the design's positional (not per-customer) AVATARS cycling. */
export const AVATAR_TINTS: AvatarTint[] = ['mint', 'clay', 'amber', 'dark', 'draft'];

/** Every-stage-up-to-`stage` history, back-dated one day per step from `endISO`. */
function historyTo(stage: StageId, endISO: string): StageHistoryEntry[] {
  const end = stageIndex(stage);
  const endMs = new Date(endISO).getTime();
  return STAGE_IDS.slice(0, end + 1).map((s, i) => ({
    stage: s,
    at: new Date(endMs - (end - i) * 86_400_000).toISOString(),
  }));
}

interface SeedInput {
  id: string;
  ref: string;
  customer: string;
  city: string;
  product: string;
  qty: number;
  stage: StageId;
  ship: string;
  shipDays: number;
  value: number;
  po: string;
  channel: string;
  terms: string;
  sizes: [string, number][];
  priority: OrderPriority;
  assignedTo: string;
  /** ISO date the order reached its current stage — seeds the stage history. */
  reachedAt: string;
}

const SEED_INPUT: SeedInput[] = [
  { id: 'o1', ref: 'SO-2291', customer: 'Northfield Apparel', city: 'Leeds, UK', product: 'Oversized hoodie · AW26', qty: 2400, stage: 'cutting', ship: '27 Aug', shipDays: 4, value: 4320000, po: 'NF-8841', channel: 'Wholesale', terms: '30 days', sizes: [['S', 240], ['M', 720], ['L', 840], ['XL', 480], ['2XL', 120]], priority: 'high', assignedTo: 'Pramila Tamang', reachedAt: '2026-08-22' },
  { id: 'o2', ref: 'SO-2290', customer: 'Halden & Co.', city: 'Manchester, UK', product: 'Organic cotton tee', qty: 5000, stage: 'packing', ship: '25 Aug', shipDays: 2, value: 3150000, po: 'HC-2207', channel: 'Wholesale', terms: '45 days', sizes: [['S', 750], ['M', 1500], ['L', 1600], ['XL', 900], ['2XL', 250]], priority: 'high', assignedTo: 'Sita Rai', reachedAt: '2026-08-23' },
  { id: 'o3', ref: 'SO-2289', customer: 'Base Layer Studio', city: 'Oslo, NO', product: 'Merino base layer', qty: 900, stage: 'finishing', ship: '29 Aug', shipDays: 6, value: 2880000, po: 'BLS-114', channel: 'DTC brand', terms: 'Prepaid', sizes: [['S', 180], ['M', 270], ['L', 270], ['XL', 135], ['2XL', 45]], priority: 'normal', assignedTo: 'Dan Miller', reachedAt: '2026-08-24' },
  { id: 'o4', ref: 'SO-2288', customer: 'Karve Outdoor', city: 'Bristol, UK', product: 'Fleece jogger', qty: 1800, stage: 'sourcing', ship: '08 Sep', shipDays: 16, value: 2160000, po: 'KO-5512', channel: 'Wholesale', terms: '30 days', sizes: [['S', 216], ['M', 540], ['L', 630], ['XL', 342], ['2XL', 72]], priority: 'normal', assignedTo: 'Manisha KC', reachedAt: '2026-08-20' },
  { id: 'o5', ref: 'SO-2287', customer: 'Thamel Threads', city: 'Kathmandu, NP', product: 'Cotton overshirt', qty: 1200, stage: 'cutting', ship: '26 Aug', shipDays: 3, value: 960000, po: 'TT-0091', channel: 'Domestic', terms: 'Cash', sizes: [['S', 180], ['M', 360], ['L', 400], ['XL', 200], ['2XL', 60]], priority: 'high', assignedTo: 'Sita Rai', reachedAt: '2026-08-23' },
  { id: 'o6', ref: 'SO-2286', customer: 'Ridgeline Supply', city: 'Glasgow, UK', product: 'Terry crew sweat', qty: 3200, stage: 'sourcing', ship: '12 Sep', shipDays: 20, value: 4160000, po: 'RS-3390', channel: 'Wholesale', terms: '60 days', sizes: [['S', 384], ['M', 960], ['L', 1120], ['XL', 576], ['2XL', 160]], priority: 'normal', assignedTo: 'Pramila Tamang', reachedAt: '2026-08-19' },
  { id: 'o7', ref: 'SO-2283', customer: 'Halden & Co.', city: 'Manchester, UK', product: 'Cropped tee · SS27 sample', qty: 600, stage: 'delivered', ship: '18 Aug', shipDays: -5, value: 420000, po: 'HC-2199', channel: 'Wholesale', terms: '45 days', sizes: [['S', 90], ['M', 180], ['L', 190], ['XL', 110], ['2XL', 30]], priority: 'normal', assignedTo: 'Dan Miller', reachedAt: '2026-08-18' },
  { id: 'o8', ref: 'SO-2281', customer: 'Northfield Apparel', city: 'Leeds, UK', product: 'Zip-through hoodie', qty: 1500, stage: 'delivered', ship: '14 Aug', shipDays: -9, value: 2700000, po: 'NF-8802', channel: 'Wholesale', terms: '30 days', sizes: [['S', 180], ['M', 450], ['L', 525], ['XL', 300], ['2XL', 45]], priority: 'normal', assignedTo: 'Manisha KC', reachedAt: '2026-08-14' },
];

export const seedOrders: Order[] = SEED_INPUT.map(({ reachedAt, ...o }) => ({
  ...o,
  status: 'active',
  stageHistory: historyTo(o.stage, reachedAt),
  notes:
    o.id === 'o2'
      ? [{ id: 'n1', body: 'Buyer confirmed carton ratio — 12 per master.', at: '2026-08-23T09:20:00.000Z', who: 'Sita Rai' }]
      : [],
}));

/** Next `SO-NNNN` ref from the current max. */
export function nextOrderRef(orders: Order[]): string {
  const max = orders.reduce((m, o) => {
    const n = parseInt(o.ref.replace(/\D/g, ''), 10);
    return Number.isFinite(n) && n > m ? n : m;
  }, 0);
  return `SO-${max + 1}`;
}
