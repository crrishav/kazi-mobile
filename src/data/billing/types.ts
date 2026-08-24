export type Currency = 'GBP' | 'EUR' | 'NPR';
export type PaymentMethod = 'cash' | 'bank' | 'credit';
export type InvoiceStatus = 'accepted' | 'collected' | 'cancelled';
export type BillingFilter = 'all' | InvoiceStatus;
export type BillingView = 'list' | 'detail';
export type SheetType = 'challans' | 'pay' | null;
export type ClientId = 'northfield' | 'halden' | 'thamel' | 'baselayer' | 'karve' | 'ridgeline';

export interface InvoiceLine {
  desc: string;
  challan: string;
  qty: number;
  rate: number;
}

export interface InvoiceChallan {
  no: string;
  meta: string;
}

export interface Payment {
  cur: Currency;
  amt: number;
  rate: number;
  method: PaymentMethod;
  acct: string | null;
  ref: string;
  date: string;
}

export interface Invoice {
  id: string;
  ref: string;
  client: ClientId;
  cur: Currency;
  rate: number;
  export: boolean;
  so: string;
  issued: string;
  due: string;
  dueDays: number;
  terms: string;
  cancelled: boolean;
  cancelNote?: string;
  challans: InvoiceChallan[];
  lines: InvoiceLine[];
  payments: Payment[];
}

export interface OpenChallan {
  id: string;
  no: string;
  client: ClientId;
  pcs: number;
  date: string;
  so: string;
  cur: Currency;
  rate: number;
  desc: string;
}

export interface Client {
  name: string;
  city: string;
  initials: string;
  avatarBg: string;
  avatarFg: string;
}

export interface Account {
  id: string;
  code: string;
  label: string;
}
