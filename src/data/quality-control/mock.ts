import type { QcPoint, QueueItem, QueuePriority } from './types';

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

export const seedQueue: QueueItem[] = [
  { id: 'q1', product: 'Terry fabric hoodies', code: 'BATCH-118', qty: '2,400 pcs', sample: '125', gate: 'Cutting → Finishing', priority: 'high', waiting: '42m' },
  { id: 'q2', product: 'Organic cotton tees', code: 'BATCH-116', qty: '5,000 pcs', sample: '200', gate: 'Finishing → Packing', priority: 'normal', waiting: '1h 10m' },
  { id: 'q3', product: 'Merino base layers', code: 'BATCH-115', qty: '900 pcs', sample: '80', gate: 'Packing → Dispatch', priority: 'watch', waiting: '2h 05m' },
  { id: 'q4', product: 'Fleece joggers', code: 'BATCH-119', qty: '1,800 pcs', sample: '125', gate: 'Cutting → Finishing', priority: 'normal', waiting: '3h 30m' },
];
