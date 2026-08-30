/**
 * Live `finance_purchases` writers — the reference ERP's own collection, shared
 * by the Purchases screen and Finance › Purchases. The mobile `PurchaseEntry`
 * field names already mirror the live doc, so the mapping is near 1:1.
 */

import { createDocument, patchDocument, removeDocument } from '@/lib/firestore/write';
import { getActor } from '@/data/notifications/actor';

import type { PurchaseEntry } from './types';

const COLLECTION = 'finance_purchases';

function toLive(e: Partial<PurchaseEntry>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (e.expenseId !== undefined) out.expenseId = e.expenseId;
  if (e.party !== undefined) out.expenseItem = e.party;
  if (e.category !== undefined) out.category = e.category;
  if (e.paymentType !== undefined) out.paymentType = e.paymentType === 'Bank' ? 'Bank' : 'CASH';
  if (e.bankName !== undefined) out.bankName = e.bankName;
  if (e.date !== undefined) out.date = e.date;
  if (e.vatBill !== undefined) out.vatBill = e.vatBill;
  if (e.discountAmt !== undefined) out.discountAmt = e.discountAmt;
  if (e.taxableAmt !== undefined) out.taxableAmt = e.taxableAmt;
  if (e.subtotalNPR !== undefined) out.subtotalNPR = e.subtotalNPR;
  if (e.vatAmountNPR !== undefined) out.vatAmountNPR = e.vatAmountNPR;
  if (e.amountNPR !== undefined) out.amountNPR = e.amountNPR;
  if (e.items !== undefined) {
    out.items = e.items.map((l) => ({
      particulars: l.particulars,
      quantity: l.quantity,
      unit: l.unit,
      rate: l.rate,
      amount: l.amount,
    }));
  }
  return out;
}

export async function addEntry(entry: PurchaseEntry): Promise<void> {
  await createDocument(COLLECTION, { ...toLive(entry), loggedBy: getActor()?.name ?? 'kazi-mobile' });
}

export async function updateEntry(id: string, updates: Partial<PurchaseEntry>): Promise<void> {
  const fields = toLive(updates);
  if (Object.keys(fields).length > 0) await patchDocument(COLLECTION, id, fields);
}

export async function deleteEntry(id: string): Promise<void> {
  await removeDocument(COLLECTION, id);
}

/** Snapshot restore (undo) — not reversed in Firestore this pass. */
export async function restoreEntries(_previous: PurchaseEntry[]): Promise<void> {
  /* intentionally no live write */
}
