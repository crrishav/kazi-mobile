import { simulateLatency } from '../mock/delay';
import { seedInvoices, seedOpenChallans } from './mock';
import type { Invoice, OpenChallan, Payment } from './types';

let invoicesDb: Invoice[] = [...seedInvoices];
let challansDb: OpenChallan[] = [...seedOpenChallans];

export async function fetchInvoices(): Promise<Invoice[]> {
  await simulateLatency();
  return [...invoicesDb];
}

export async function addInvoice(invoice: Invoice): Promise<void> {
  await simulateLatency(300);
  invoicesDb = [invoice, ...invoicesDb];
}

export async function addPayment(invoiceId: string, payment: Payment): Promise<void> {
  await simulateLatency(300);
  invoicesDb = invoicesDb.map((v) => (v.id === invoiceId ? { ...v, payments: [...v.payments, payment] } : v));
}

export async function restoreInvoices(previous: Invoice[]): Promise<void> {
  await simulateLatency(150);
  invoicesDb = [...previous];
}

export async function fetchOpenChallans(): Promise<OpenChallan[]> {
  await simulateLatency(250);
  return [...challansDb];
}

export async function removeOpenChallan(id: string): Promise<void> {
  await simulateLatency(200);
  challansDb = challansDb.filter((c) => c.id !== id);
}
