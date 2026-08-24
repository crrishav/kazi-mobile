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

export interface StockMovement {
  sign: '+' | '−';
  title: string;
  ref: string;
  amount: string;
  balance: string;
  tone: 'in' | 'out';
}

export interface NewStockDraft {
  name: string;
  qty: string;
  threshold: string;
  unit: string;
}
