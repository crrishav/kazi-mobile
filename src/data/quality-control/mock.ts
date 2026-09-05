import { seedOrders } from '../sales/mock';
import type { StageId } from '../sales/types';
import { priorityOf } from '../sales/utils';
import type { QcLog, QcPoint, QueueItem, QueuePriority } from './types';

const daysAgoISO = (n: number) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);

export const POINTS: QcPoint[] = [
  { id: 'p1', label: 'Measurement spec', spec: '±1.5 cm tolerance · 5 points' },
  { id: 'p2', label: 'Stitch density', spec: '11–13 SPI · seams & hems' },
  { id: 'p3', label: 'Seam strength', spec: 'Pull test · shoulder, side' },
  { id: 'p4', label: 'Shade match', spec: 'Against approved lab dip' },
  { id: 'p5', label: 'Trims & labels', spec: 'Care, size, origin, hangtag' },
  { id: 'p6', label: 'Print / embroidery', spec: 'Placement ±0.5 cm' },
  { id: 'p7', label: 'Pressing finish', spec: 'No shine, no pucker' },
  { id: 'p8', label: 'Polybag & carton', spec: 'Barcode, ratio, count' },
  { id: 'p9', label: 'Metal detection', spec: 'Needle pass · mandatory' },
];

export const PRIORITY: Record<QueuePriority, { label: string; dot: string; bg: string; fg: string }> = {
  high: { label: 'Hold line', dot: '#C0603C', bg: '#F8E7DF', fg: '#8E4327' },
  normal: { label: 'Routine', dot: '#22A97A', bg: '#E2F6EC', fg: '#0E5E43' },
  watch: { label: 'Re-check', dot: '#B98514', bg: '#F7EEDA', fg: '#7A5709' },
};

type QcStage = 'cutting' | 'finishing' | 'packing';

/** QC gates a job at each stage transition. */
const QC_STAGES: StageId[] = ['cutting', 'finishing', 'packing'];
const GATE_LABEL: Record<QcStage, string> = {
  cutting: 'Cutting → Finishing',
  finishing: 'Finishing → Packing',
  packing: 'Packing → Dispatch',
};

/**
 * The QC queue is derived from the orders sitting at a gate stage, not an
 * invented list. It used to derive off `production` batches; that module was
 * merged into the order pipeline, and `orders.stage` is what carries the gate
 * now. Seed-only — there is no live queue collection (see `api.ts`).
 */
export const seedQueue: QueueItem[] = seedOrders
  .filter((o) => QC_STAGES.includes(o.stage) && o.status === 'active')
  .map((o, i) => {
    const stage = o.stage as QcStage;
    return {
      id: `q_${o.id}`,
      batchId: o.id,
      product: o.product,
      code: o.ref,
      qty: `${o.qty.toLocaleString('en-US')} pcs`,
      sample: String(Math.max(80, Math.round(o.qty * 0.05))),
      gate: GATE_LABEL[stage],
      priority: priorityOf(o) === 'urgent' ? 'high' : stage === 'packing' ? 'watch' : i === 0 ? 'high' : 'normal',
      waiting: o.ship ? `due ${o.ship}` : 'no delivery date',
    };
  });

/** Historical `qc_logs` so the pass-rate rollup has data before the first live inspection. */
export const seedQcLogs: QcLog[] = [
  { id: 'qc1', batchId: 'b5', code: 'BATCH-114', product: 'Fleece joggers', date: daysAgoISO(1), checkedCount: 9, passedCount: 9, defects: 0, passRate: 100, verdict: 'pass', defectNotes: '', inspector: 'Pramila T.' },
  { id: 'qc2', batchId: 'b4', code: 'BATCH-115', product: 'Merino base layers', date: daysAgoISO(2), checkedCount: 9, passedCount: 8, defects: 3, passRate: 89, verdict: 'flag', defectNotes: 'Shade slightly warm on 3 pcs vs approved lab dip — inside buyer tolerance.', inspector: 'Pramila T.' },
  { id: 'qc3', batchId: 'b3', code: 'BATCH-116', product: 'Organic cotton tees', date: daysAgoISO(4), checkedCount: 9, passedCount: 9, defects: 1, passRate: 100, verdict: 'pass', defectNotes: '', inspector: 'Pramila T.' },
  { id: 'qc4', batchId: 'b2', code: 'BATCH-117', product: 'Chinese terry fabric', date: daysAgoISO(6), checkedCount: 9, passedCount: 6, defects: 8, passRate: 67, verdict: 'fail', defectNotes: 'Fabric short + shade variance across rolls; rework not viable, substitution pending.', inspector: 'Anil K.' },
];
