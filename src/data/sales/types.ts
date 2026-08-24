export type StageId = 'sourcing' | 'cutting' | 'finishing' | 'packing' | 'delivered';
export type SalesFilter = 'all' | 'late' | StageId;
export type SalesView = 'list' | 'detail';

export interface Stage {
  id: StageId;
  label: string;
  short: string;
  dot: string;
  bg: string;
  fg: string;
  bar: string;
}

export interface Order {
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
}
