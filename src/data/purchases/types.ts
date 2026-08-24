export type PurchaseMethod = 'Cash' | 'Bank';
export type PurchaseStatus = 'paid' | 'partial' | 'unpaid';
export type PurchaseGroup = 'date' | 'supplier';
export type PurchaseFilter = 'all' | 'unpaid' | 'cash' | 'bank';
export type PurchaseView = 'list' | 'detail';
export type DateOptionId = 'today' | 'yesterday' | 'earlier';

export interface PurchaseLine {
  name: string;
  qty: string;
  value: string;
}

export interface PurchaseEntry {
  id: string;
  ref: string;
  supplier: string;
  item: string;
  qty: string;
  amount: number;
  method: PurchaseMethod;
  status: PurchaseStatus;
  date: string;
  due: string;
  grn: string;
  bill: string;
  lines: PurchaseLine[];
}

export interface PurchaseDraft {
  amount: string;
  supplier: string;
  item: string;
  method: PurchaseMethod;
  status: PurchaseStatus;
  date: DateOptionId;
  bill: boolean;
}
