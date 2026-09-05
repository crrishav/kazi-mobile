export type CheckVerdict = 'pass' | 'flag' | 'fail';
export type QueuePriority = 'high' | 'normal' | 'watch';
export type QcView = 'queue' | 'detail';

export interface QcPoint {
  id: string;
  label: string;
  spec: string;
}

export interface QueueItem {
  id: string;
  /** The order this QC entry gates (`orders.id`). */
  batchId: string;
  product: string;
  code: string;
  qty: string;
  sample: string;
  gate: string;
  priority: QueuePriority;
  waiting: string;
}

/** A completed QC inspection record (reference `qc_logs` collection, item 24). */
export interface QcLog {
  id: string;
  batchId: string;
  code: string;
  product: string;
  /** AD ISO date. */
  date: string;
  checkedCount: number;
  passedCount: number;
  defects: number;
  /** 0–100. */
  passRate: number;
  verdict: CheckVerdict;
  defectNotes: string;
  inspector: string;
}

export interface QcPhoto {
  label: string;
  time: string;
}

export interface QcNote {
  time: string;
  body: string;
}
