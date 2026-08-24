export type CustomerType = 'company' | 'person';
export type CustomersFilter = 'all' | 'company' | 'person' | 'owing';
export type CustomersView = 'list' | 'detail' | 'form';
export type InvoiceStatus = 'open' | 'paid' | 'overdue';
export type OrderStageId = 'sourcing' | 'cutting' | 'finishing' | 'packing';

export interface CustomerOrder {
  product: string;
  meta: string;
  stage: OrderStageId;
}

export interface CustomerInvoice {
  ref: string;
  amount: number;
  due: string;
  status: InvoiceStatus;
}

export interface Customer {
  id: string;
  type: CustomerType;
  name: string;
  contact: string;
  role: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  address: string;
  terms: string;
  since: string;
  orders: CustomerOrder[];
  invoices: CustomerInvoice[];
}

export type CustomerDraft = Pick<Customer, 'type' | 'name' | 'contact' | 'role' | 'email' | 'phone' | 'city' | 'country' | 'address' | 'terms'>;
