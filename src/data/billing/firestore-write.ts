/**
 * Live `invoices` + `quotations` writers — the reference ERP's own collections.
 * Challans (open + doc) have no live collection and stay mock-only.
 *
 * The mobile `Invoice` carries a lot of derived/mobile-only state; only the
 * fields that exist on the live doc are written. A payment is folded into the
 * scalar `amountPaid` (the live shape has no payments array), which needs a
 * read-modify-write.
 */

import { doc, getDoc } from '@/lib/supabase/firestore-compat';

import { getDb } from '@/lib/supabase/firestore-compat';
import { num } from '@/lib/firestore/normalise';
import { createDocument, patchDocument } from '@/lib/supabase/write';
import { getActor } from '@/data/notifications/actor';

import type { Challan, ChallanStatus, Invoice, Payment, Quotation, QuotationStatus } from './types';

const INVOICES = 'invoices';
const QUOTATIONS = 'quotations';
const CHALLANS = 'challans';

function invoiceLines(inv: Partial<Invoice>) {
  return (inv.lines ?? []).map((l) => ({
    description: l.desc,
    challan: l.challan ?? '',
    qty: l.qty,
    rate: l.rate,
    unit: l.unit ?? '',
  }));
}

function paidNPR(payments: Payment[] | undefined): number {
  return (payments ?? []).reduce(
    (sum, p) => sum + (p.cur === 'NPR' ? p.amt : Math.round(p.amt * p.rate)),
    0,
  );
}

function invoiceToLive(inv: Partial<Invoice>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (inv.ref !== undefined) out.invoiceNumber = inv.ref;
  if (inv.issuedISO ?? inv.issued) out.date = inv.issuedISO ?? inv.issued;
  if (inv.dueISO ?? inv.due) out.dueDate = inv.dueISO ?? inv.due;
  if (inv.clientName !== undefined) out.clientName = inv.clientName;
  if (inv.clientPAN !== undefined) out.clientPAN = inv.clientPAN;
  if (inv.clientPhone !== undefined) out.clientPhone = inv.clientPhone;
  if (inv.clientAddress !== undefined) out.clientAddress = inv.clientAddress;
  if (inv.applyVAT !== undefined) out.applyVAT = inv.applyVAT;
  if (inv.cur !== undefined) out.currency = inv.cur;
  if (inv.paymentTerms ?? inv.terms) out.paymentTerms = inv.paymentTerms ?? inv.terms;
  if (inv.discountPct !== undefined) out.discountPct = inv.discountPct;
  if (inv.discountMode !== undefined) out.discountMode = inv.discountMode;
  if (inv.discountFlatAmt !== undefined) out.discountFlatAmt = inv.discountFlatAmt;
  // The live doc also stores the *effective* discount; recompute it whenever the
  // write carries enough (lines + mode) to know what it is.
  if (inv.lines && inv.discountMode !== undefined) {
    const sub = inv.lines.reduce((n, l) => n + l.qty * l.rate, 0);
    out.discountAmtNPR =
      inv.discountMode === 'amount'
        ? Math.min(sub, inv.discountFlatAmt ?? 0)
        : sub * (Math.min(100, inv.discountPct ?? 0) / 100);
  }
  if (inv.paymentType !== undefined) out.paymentType = inv.paymentType;
  if (inv.bankName !== undefined) out.bankName = inv.bankName;
  if (inv.note !== undefined) out.note = inv.note;
  if (inv.explicitStatus !== undefined) out.status = inv.explicitStatus;
  else if (inv.cancelled) out.status = 'Cancelled';
  if (inv.relatedChallan !== undefined) out.relatedChallan = inv.relatedChallan;
  if (inv.relatedQuotation !== undefined) out.relatedQuotation = inv.relatedQuotation;
  if (inv.lines !== undefined) out.items = invoiceLines(inv);
  if (inv.payments !== undefined) out.amountPaid = paidNPR(inv.payments);
  return out;
}

export async function addInvoice(invoice: Invoice): Promise<void> {
  await createDocument(INVOICES, {
    ...invoiceToLive(invoice),
    createdBy: getActor()?.name ?? 'kazi-mobile',
  });
}

export async function updateInvoice(id: string, updates: Partial<Invoice>): Promise<void> {
  const fields = invoiceToLive(updates);
  if (Object.keys(fields).length > 0) await patchDocument(INVOICES, id, fields);
}

export async function addPayment(invoiceId: string, payment: Payment): Promise<void> {
  const add = payment.cur === 'NPR' ? payment.amt : Math.round(payment.amt * payment.rate);
  let current = 0;
  try {
    const snap = await getDoc(doc(getDb(), INVOICES, invoiceId));
    current = num((snap.data() as Record<string, unknown> | undefined)?.amountPaid);
  } catch {
    current = 0;
  }
  await patchDocument(INVOICES, invoiceId, { amountPaid: current + add });
}

/** Snapshot restore (undo) — not reversed in Firestore this pass. */
export async function restoreInvoices(_previous: Invoice[]): Promise<void> {
  /* intentionally no live write */
}

// ---- Quotations ----

function quotationToLive(q: Partial<Quotation>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (q.number !== undefined) out.quotationNumber = q.number;
  if (q.date !== undefined) out.date = q.date;
  if (q.clientName !== undefined) out.clientName = q.clientName;
  if (q.clientPAN !== undefined) out.clientPAN = q.clientPAN;
  if (q.clientPhone !== undefined) out.clientPhone = q.clientPhone;
  if (q.clientAddress !== undefined) out.clientAddress = q.clientAddress;
  if (q.discountPct !== undefined) out.discountPct = q.discountPct;
  if (q.discountFlatAmt !== undefined) out.discountAmtNPR = q.discountFlatAmt;
  if (q.note !== undefined) out.note = q.note;
  if (q.status !== undefined) out.status = q.status;
  if (q.currency !== undefined) out.currency = q.currency;
  if (q.validUntil !== undefined) out.validUntil = q.validUntil;
  if (q.terms !== undefined) out.terms = q.terms;
  if (q.relatedInvoice !== undefined) out.relatedInvoice = q.relatedInvoice;
  if (q.lines !== undefined) {
    out.items = q.lines.map((l) => ({ description: l.desc, qty: l.qty, unit: l.unit, rate: l.rate }));
  }
  return out;
}

export async function addQuotation(quotation: Quotation): Promise<void> {
  await createDocument(QUOTATIONS, {
    ...quotationToLive(quotation),
    createdBy: quotation.createdBy || getActor()?.name || 'kazi-mobile',
  });
}

export async function updateQuotation(id: string, updates: Partial<Quotation>): Promise<void> {
  const fields = quotationToLive(updates);
  if (Object.keys(fields).length > 0) await patchDocument(QUOTATIONS, id, fields);
}

// ---- Challans ----

function challanToLive(c: Partial<Challan>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (c.number !== undefined) out.challanNumber = c.number;
  if (c.date !== undefined) out.date = c.date;
  if (c.clientName !== undefined) out.clientName = c.clientName;
  if (c.clientPAN !== undefined) out.clientPAN = c.clientPAN;
  if (c.clientPhone !== undefined) out.clientPhone = c.clientPhone;
  if (c.clientAddress !== undefined) out.clientAddress = c.clientAddress;
  if (c.discountMode !== undefined) out.discountMode = c.discountMode;
  if (c.discountPct !== undefined) out.discountPct = c.discountPct;
  if (c.discountFlatAmt !== undefined) out.discountFlatAmt = c.discountFlatAmt;
  if (c.note !== undefined) out.note = c.note;
  if (c.status !== undefined) out.status = c.status;
  if (c.fiscalYear !== undefined) out.fiscalYear = c.fiscalYear;
  if (c.vehicleNo !== undefined) out.vehicleNo = c.vehicleNo;
  if (c.driverName !== undefined) out.driverName = c.driverName;
  if (c.routeFrom !== undefined) out.routeFrom = c.routeFrom;
  if (c.routeTo !== undefined) out.routeTo = c.routeTo;
  if (c.relatedInvoice !== undefined) out.relatedInvoice = c.relatedInvoice;
  if (c.lines !== undefined) {
    out.items = c.lines.map((l) => ({ description: l.desc, qty: l.qty, unit: l.unit, rate: l.rate }));
  }
  return out;
}

export async function updateChallan(id: string, updates: Partial<Challan>): Promise<void> {
  const fields = challanToLive(updates);
  if (Object.keys(fields).length > 0) await patchDocument(CHALLANS, id, fields);
}

export async function updateChallanStatus(id: string, status: ChallanStatus): Promise<void> {
  await patchDocument(CHALLANS, id, { status });
}

/** Snapshot restore (undo) — not reversed server-side, same as invoices. */
export async function restoreChallans(_previous: Challan[]): Promise<void> {
  /* intentionally no live write */
}

export async function updateQuotationStatus(id: string, status: QuotationStatus): Promise<void> {
  await patchDocument(QUOTATIONS, id, { status });
}

/** Snapshot restore (undo) — not reversed in Firestore this pass. */
export async function restoreQuotations(_previous: Quotation[]): Promise<void> {
  /* intentionally no live write */
}
