/**
 * Live `invoices` + `quotations` readers (Track B, read-only). Writes stay on
 * `mock-api.ts`; `fetchChallans` / `fetchOpenChallans` stay mock entirely (no
 * live `challans` collection — FRONTEND_GAP_PLAN §6).
 *
 * Live shapes (sampled 2026-08-30):
 *   invoices    { invoiceNumber, date, dueDate, fiscalYear, clientName, clientPAN,
 *                 clientPhone, clientAddress, status (Draft/Sent/Paid/Partial/Cancelled),
 *                 applyVAT, currency (NPR/GBP), paymentTerms, items (JSON string OR array,
 *                 rate/qty may be strings), discountPct, discountAmtNPR, subtotalNPR,
 *                 taxableAmtNPR, vatAmountNPR, totalNPR, amountPaid, relatedChallan,
 *                 relatedQuotation, note, createdBy/At, updatedBy/At }
 *   quotations  like invoices + { quotationNumber, validUntil, terms, relatedInvoice, currency }
 *
 * Gaps handled locally (see plan §Batch 2):
 *   - `client: ClientId` union → fixed 'northfield'; every screen reads `clientName` first
 *   - `payments[]` → synthesised from the `amountPaid` scalar (one row)
 *   - no per-invoice FX rate  → `GBP_RATE`
 */

import { GBP_RATE } from '@/lib/currency';
import { arr, bool, num, str, tsToISO } from '@/lib/firestore/normalise';
import { readCollection, type DocData } from '@/lib/supabase/read';

import type {
  ClientId,
  Currency,
  DocCurrency,
  DocLine,
  Invoice,
  InvoiceLine,
  Payment,
  PaymentMethod,
  Quotation,
  QuotationStatus,
} from './types';

const DEFAULT_CLIENT: ClientId = 'northfield';

function mapCurrency(raw: unknown): Currency {
  const s = str(raw).trim().toUpperCase();
  return s === 'GBP' ? 'GBP' : s === 'EUR' ? 'EUR' : 'NPR';
}

function daysBetween(fromISO: string, toISO: string): number {
  const a = new Date(fromISO).getTime();
  const b = new Date(toISO).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  return Math.round((b - a) / 86_400_000);
}

/** One `items[]` element → an invoice line (keys and number types vary live). */
function toInvoiceLine(raw: unknown): InvoiceLine {
  const e = (raw ?? {}) as DocData;
  return {
    desc: str(e.description ?? e.desc ?? e.item ?? e.name ?? e.particulars).trim(),
    challan: str(e.challan).trim(),
    qty: num(e.qty ?? e.quantity, 1),
    rate: num(e.rate ?? e.price ?? e.unitPrice),
    unit: str(e.unit).trim() || undefined,
  };
}

function toDocLine(raw: unknown): DocLine {
  const e = (raw ?? {}) as DocData;
  return {
    desc: str(e.description ?? e.desc ?? e.item ?? e.name ?? e.particulars).trim(),
    qty: num(e.qty ?? e.quantity, 1),
    unit: str(e.unit).trim() || 'pc',
    rate: num(e.rate ?? e.price ?? e.unitPrice),
  };
}

function mapInvoiceDoc(id: string, d: DocData): Invoice | null {
  const clientName = str(d.clientName).trim();
  const number = str(d.invoiceNumber).trim();
  if (!clientName && !number) return null;

  const cur = mapCurrency(d.currency);
  const rate = cur === 'NPR' ? 1 : GBP_RATE;
  const issuedISO = str(d.date).trim() || tsToISO(d.createdAt).slice(0, 10);
  const dueISO = str(d.dueDate).trim() || issuedISO;
  const applyVAT = bool(d.applyVAT);
  const status = str(d.status).trim();
  const amountPaid = num(d.amountPaid);

  const lines = arr<unknown>(d.items).map(toInvoiceLine).filter((l) => l.desc || l.qty || l.rate);

  const payments: Payment[] = amountPaid > 0
    ? [{
        cur,
        amt: cur === 'NPR' ? amountPaid : Math.round((amountPaid / rate) * 100) / 100,
        rate,
        method: (str(d.paymentType).toLowerCase() as PaymentMethod) || 'bank',
        acct: null,
        ref: '',
        date: tsToISO(d.updatedAt).slice(0, 10) || issuedISO,
      }]
    : [];

  return {
    id,
    ref: number || `INV-${id.slice(0, 4).toUpperCase()}`,
    client: DEFAULT_CLIENT,
    cur,
    rate,
    export: !applyVAT,
    so: '',
    issued: issuedISO,
    due: dueISO,
    dueDays: daysBetween(issuedISO, dueISO),
    terms: str(d.paymentTerms).trim(),
    cancelled: /cancel/i.test(status),
    challans: [],
    lines,
    payments,
    clientName: clientName || undefined,
    clientPAN: str(d.clientPAN).trim() || undefined,
    clientPhone: str(d.clientPhone).trim() || undefined,
    clientAddress: str(d.clientAddress).trim() || undefined,
    applyVAT,
    discountMode: 'pct',
    discountPct: num(d.discountPct),
    discountFlatAmt: num(d.discountAmtNPR),
    issuedISO,
    dueISO,
    paymentTerms: str(d.paymentTerms).trim() || undefined,
    explicitStatus: status === 'Draft' ? 'Draft' : status === 'Sent' ? 'Sent' : undefined,
    relatedChallan: str(d.relatedChallan).trim() || undefined,
    relatedQuotation: str(d.relatedQuotation).trim() || undefined,
  };
}

function mapQuotationStatus(raw: unknown): QuotationStatus {
  const s = str(raw).trim().toLowerCase();
  if (s === 'sent') return 'Sent';
  if (s === 'accepted') return 'Accepted';
  if (s === 'rejected') return 'Rejected';
  if (s === 'cancelled' || s === 'canceled') return 'Cancelled';
  return 'Draft';
}

function mapQuotationDoc(id: string, d: DocData): Quotation | null {
  const clientName = str(d.clientName).trim();
  const number = str(d.quotationNumber).trim();
  if (!clientName && !number) return null;
  const date = str(d.date).trim() || tsToISO(d.createdAt).slice(0, 10);
  return {
    id,
    number: number || `QT-${id.slice(0, 4).toUpperCase()}`,
    date,
    clientName: clientName || '—',
    clientPAN: str(d.clientPAN).trim(),
    clientPhone: str(d.clientPhone).trim(),
    clientAddress: str(d.clientAddress).trim(),
    lines: arr<unknown>(d.items).map(toDocLine).filter((l) => l.desc || l.qty || l.rate),
    discountMode: 'pct',
    discountPct: num(d.discountPct),
    discountFlatAmt: num(d.discountAmtNPR),
    note: str(d.note).trim(),
    createdBy: str(d.createdBy).trim(),
    status: mapQuotationStatus(d.status),
    currency: (str(d.currency).trim().toUpperCase() === 'GBP' ? 'GBP' : 'NPR') as DocCurrency,
    validUntil: str(d.validUntil).trim() || date,
    terms: str(d.terms).trim(),
    relatedInvoice: str(d.relatedInvoice).trim(),
  };
}

export async function fetchInvoices(): Promise<Invoice[]> {
  return readCollection('invoices', mapInvoiceDoc);
}

export async function fetchQuotations(): Promise<Quotation[]> {
  return readCollection('quotations', mapQuotationDoc);
}
