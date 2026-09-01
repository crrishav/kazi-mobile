/**
 * Live `finance_purchases` reader (Track B, read-only). Shared by the standalone
 * Purchases screen and Finance › Purchases tab. Writes stay on `mock-api.ts`.
 *
 * Live shape (sampled 2026-08-30): { expenseId, expenseItem, category,
 *   paymentType ("CASH"/"Bank"), bankName?, vatBill, discountAmt?, taxableAmt?,
 *   subtotalNPR?, vatAmountNPR?, amountNPR, date, items[] ({particulars,
 *   quantity, unit, rate, amount}) — sometimes a JSON string, createdAt }
 *
 * Gaps handled locally (see plan §Batch 1):
 *   - no `party`/supplier field → falls back to `expenseItem`
 *   - no `status` field         → 'paid'
 *   - totals absent on a doc    → recomputed via `computeTotals`
 */

import { bool, num, parseMaybeJson, str, tsToISO } from '@/lib/firestore/normalise';
import { readCollection, type DocData } from '@/lib/supabase/read';

import { PURCHASE_CATEGORIES, type PaymentType, type PurchaseCategory, type PurchaseEntry, type PurchaseLine } from './types';
import { computeTotals } from './utils';

function mapCategory(raw: unknown): PurchaseCategory {
  const s = str(raw).trim().toLowerCase();
  return PURCHASE_CATEGORIES.find((c) => c.toLowerCase() === s) ?? 'Other';
}

function mapPayment(raw: unknown): PaymentType {
  return /bank/i.test(str(raw)) ? 'Bank' : 'Cash';
}

function mapLines(raw: unknown, fallbackItem: string, fallbackAmount: number): PurchaseLine[] {
  const parsed = parseMaybeJson<unknown[]>(raw, []);
  const rows: PurchaseLine[] = (Array.isArray(parsed) ? parsed : [])
    .map((e) => {
      const entry = (e ?? {}) as DocData;
      const quantity = num(entry.quantity, 1);
      const rate = num(entry.rate);
      return {
        particulars: str(entry.particulars ?? entry.item ?? entry.name).trim(),
        quantity,
        unit: str(entry.unit).trim() || 'pcs',
        rate,
        amount: num(entry.amount) || Math.round(quantity * rate),
      };
    })
    .filter((l) => l.particulars);
  if (rows.length) return rows;
  // Synthesise a single line from the header when there are no line items.
  const item = fallbackItem.trim() || 'Purchase';
  return [{ particulars: item, quantity: 1, unit: 'pcs', rate: fallbackAmount, amount: fallbackAmount }];
}

function mapPurchaseDoc(id: string, d: DocData): PurchaseEntry | null {
  const amountNPR = num(d.amountNPR);
  const expenseItem = str(d.expenseItem).trim();
  if (!amountNPR && !expenseItem) return null;

  const vatBill = bool(d.vatBill);
  const items = mapLines(d.items, expenseItem, amountNPR);
  const liveDiscount = num(d.discountAmt);
  const computed = computeTotals(items, liveDiscount, vatBill);

  const subtotalNPR = num(d.subtotalNPR) || computed.subtotal;
  const discountAmt = liveDiscount || computed.discount;
  const taxableAmt = num(d.taxableAmt) || subtotalNPR - discountAmt;
  const vatAmountNPR = num(d.vatAmountNPR) || (vatBill ? Math.round((taxableAmt * 13) / 100) : 0);

  return {
    id,
    expenseId: str(d.expenseId).trim() || `EXP${id.slice(0, 3).toUpperCase()}`,
    party: expenseItem || 'Unnamed party',
    category: mapCategory(d.category),
    paymentType: mapPayment(d.paymentType),
    bankName: str(d.bankName).trim() || undefined,
    date: str(d.date).trim() || tsToISO(d.createdAt).slice(0, 10),
    vatBill,
    discountAmt,
    taxableAmt,
    subtotalNPR,
    vatAmountNPR,
    amountNPR: amountNPR || taxableAmt + vatAmountNPR,
    items,
    status: 'paid',
    loggedBy: str(d.loggedBy ?? d.createdBy).trim(),
  };
}

export async function fetchEntries(): Promise<PurchaseEntry[]> {
  return readCollection('finance_purchases', mapPurchaseDoc);
}
