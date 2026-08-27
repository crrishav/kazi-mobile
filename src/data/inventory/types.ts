export type StockLevel = 'low' | 'near' | 'ok';

export interface StockItem {
  id: string;
  name: string;
  sku: string;
  supplier: string;
  qty: number;
  threshold: number;
  unit: string;
  swatch: string;
  swatchFg: string;
  swatchLabel: string;
  lead: string;
  location: string;
  cost: string;
  batches: string;
}

export interface LibraryItem {
  id: string;
  group: string;
  kind: string;
  name: string;
  meta: string;
  tags: string[];
}

/** Real per-item stock ledger (item 19). `in`/`out` add a signed delta; `adjust` sets an absolute count. */
export type StockMoveKind = 'in' | 'out' | 'adjust';

export interface StockMovement {
  id: string;
  itemId: string;
  kind: StockMoveKind;
  /** Signed change applied to `qty`. */
  delta: number;
  /** `qty` after this movement. */
  balance: number;
  reason: string;
  ref: string;
  /** AD ISO date. */
  date: string;
}

export interface StockMovementDraft {
  kind: StockMoveKind;
  qty: string;
  reason: string;
  ref: string;
}

/** Editable free-text detail fields on a stock item (item 19). */
export interface StockDetailsDraft {
  threshold: string;
  lead: string;
  location: string;
  cost: string;
  supplier: string;
}

export interface NewStockDraft {
  name: string;
  qty: string;
  threshold: string;
  unit: string;
}
