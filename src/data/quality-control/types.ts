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
  product: string;
  code: string;
  qty: string;
  sample: string;
  gate: string;
  priority: QueuePriority;
  waiting: string;
}

export interface QcPhoto {
  label: string;
  time: string;
}

export interface QcNote {
  time: string;
  body: string;
}
