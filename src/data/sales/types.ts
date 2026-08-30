export type StageId = 'sourcing' | 'cutting' | 'finishing' | 'packing' | 'delivered';
export type SalesFilter = 'all' | 'late' | StageId;
export type SalesView = 'list' | 'detail';

/** `orders` is owned by the Order Management screen; Sales is a read-only consumer. */
export type OrderPriority = 'normal' | 'high';
export type OrderStatus = 'active' | 'cancelled';
export type OrderManagementView = 'board' | 'list';

export interface Stage {
  id: StageId;
  label: string;
  short: string;
  dot: string;
  bg: string;
  fg: string;
  bar: string;
}

/** One entry per stage the order has entered — appended on every move (`orders.stageHistory` live). */
export interface StageHistoryEntry {
  stage: StageId;
  at: string;
}

export interface OrderNote {
  id: string;
  body: string;
  at: string;
  who: string;
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
  priority: OrderPriority;
  status: OrderStatus;
  assignedTo: string;
  stageHistory: StageHistoryEntry[];
  notes: OrderNote[];
}

/** The create/edit form's editable slice — free-text numeric fields kept as strings. */
export interface OrderDraft {
  id: string | null;
  ref: string;
  customer: string;
  city: string;
  product: string;
  qty: string;
  value: string;
  po: string;
  channel: string;
  terms: string;
  stage: StageId;
  priority: OrderPriority;
  assignedTo: string;
}
