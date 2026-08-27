/**
 * Shared `finance_purchases` model — used by both the standalone Purchases
 * screen and the Finance › Purchases tab. Field names mirror the live
 * collection (`expenseId`, `paymentType`, `subtotalNPR`, `vatAmountNPR`,
 * `amountNPR`, `items[]` with `particulars/quantity/unit/rate/amount`).
 */

export type PaymentType = 'Cash' | 'Bank';
export type PurchaseStatus = 'paid' | 'partial' | 'unpaid';
export type PurchaseGroup = 'date' | 'supplier';
export type PurchaseFilter = 'all' | 'unpaid' | 'cash' | 'bank';
export type PurchaseView = 'list' | 'detail';

export const PURCHASE_CATEGORIES = [
  'Raw Materials',
  'Trims',
  'Packaging',
  'Machinery',
  'Services',
  'Freight',
  'Other',
] as const;
export type PurchaseCategory = (typeof PURCHASE_CATEGORIES)[number];

export const PURCHASE_UNITS = ['m', 'kg', 'pcs', 'roll', 'box', 'set'] as const;
export type PurchaseUnit = (typeof PURCHASE_UNITS)[number];

export interface PurchaseLine {
  particulars: string;
  quantity: number;
  unit: string;
  rate: number;
  /** Denormalised `quantity * rate`, matching the live docs. */
  amount: number;
}

export interface PurchaseEntry {
  id: string;
  /** `EXP0NN` — gap-free sequence shared with Finance's Purchases tab. */
  expenseId: string;
  /** Supplier / party name. */
  party: string;
  category: PurchaseCategory;
  paymentType: PaymentType;
  /** Set when `paymentType === 'Bank'`. */
  bankName?: string;
  /** AD ISO date. */
  date: string;
  vatBill: boolean;
  discountAmt: number;
  /** `subtotal - discount`. */
  taxableAmt: number;
  /** Σ of line amounts. */
  subtotalNPR: number;
  /** 13% of `taxableAmt` when `vatBill`, else 0. */
  vatAmountNPR: number;
  /** Grand total = `taxableAmt + vatAmountNPR`. */
  amountNPR: number;
  items: PurchaseLine[];
  status: PurchaseStatus;
  loggedBy: string;
  grn?: string;
}

export interface PurchaseDraftLine {
  particulars: string;
  quantity: string;
  unit: string;
  rate: string;
}

export interface PurchaseDraft {
  /** Non-null when editing an existing entry. */
  id: string | null;
  party: string;
  category: PurchaseCategory;
  paymentType: PaymentType;
  bankName: string;
  date: string;
  vatBill: boolean;
  discountAmt: string;
  status: PurchaseStatus;
  lines: PurchaseDraftLine[];
}
