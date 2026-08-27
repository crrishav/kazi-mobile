import type { PurchaseDraft, PurchaseDraftLine, PurchaseEntry, PurchaseLine } from './types';

export const VAT_RATE = 13;

export function fmt(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}

export function money(n: number): string {
  return `रु ${fmt(n)}`;
}

/** "रु 1.9L" style lakh-compact formatting, matching the design's own `short()` helper. */
export function short(n: number): string {
  return n >= 100000 ? `रु ${(n / 100000).toFixed(1).replace(/\.0$/, '')}L` : `रु ${fmt(n)}`;
}

export function lineAmount(quantity: number, rate: number): number {
  return Math.round(quantity * rate);
}

export interface PurchaseTotals {
  subtotal: number;
  discount: number;
  taxable: number;
  vat: number;
  grandTotal: number;
}

/** The single source of truth for a purchase's money math (header + line items). */
export function computeTotals(lines: { quantity: number; rate: number }[], discountAmt: number, vatBill: boolean): PurchaseTotals {
  const subtotal = lines.reduce((n, l) => n + lineAmount(l.quantity, l.rate), 0);
  const discount = Math.min(Math.max(0, Math.round(discountAmt)), subtotal);
  const taxable = subtotal - discount;
  const vat = vatBill ? Math.round((taxable * VAT_RATE) / 100) : 0;
  return { subtotal, discount, taxable, vat, grandTotal: taxable + vat };
}

/** Next `EXP0NN` id — gap-free, one ahead of the highest existing number. */
export function nextExpenseId(entries: PurchaseEntry[]): string {
  const max = entries.reduce((m, e) => {
    const n = parseInt(e.expenseId.replace(/\D/g, ''), 10);
    return Number.isFinite(n) && n > m ? n : m;
  }, 0);
  return `EXP${String(max + 1).padStart(3, '0')}`;
}

const toNum = (s: string): number => parseFloat(s.replace(/[^0-9.]/g, '')) || 0;

export function draftLinesToLines(draftLines: PurchaseDraftLine[]): PurchaseLine[] {
  return draftLines
    .filter((l) => l.particulars.trim() && toNum(l.quantity) > 0)
    .map((l) => {
      const quantity = toNum(l.quantity);
      const rate = toNum(l.rate);
      return { particulars: l.particulars.trim(), quantity, unit: l.unit || 'pcs', rate, amount: lineAmount(quantity, rate) };
    });
}

export function linesToDraftLines(lines: PurchaseLine[]): PurchaseDraftLine[] {
  return lines.map((l) => ({ particulars: l.particulars, quantity: String(l.quantity), unit: l.unit, rate: String(l.rate) }));
}

/** Build a persisted `PurchaseEntry` from the sheet draft — one shape for both the standalone screen and Finance's tab. */
export function buildEntry(draft: PurchaseDraft, existing: PurchaseEntry[], loggedBy: string): PurchaseEntry {
  const items = draftLinesToLines(draft.lines);
  const totals = computeTotals(items, toNum(draft.discountAmt), draft.vatBill);
  const current = draft.id ? existing.find((e) => e.id === draft.id) : undefined;
  return {
    id: draft.id ?? `n${Date.now()}`,
    expenseId: current?.expenseId ?? nextExpenseId(existing),
    party: draft.party.trim() || 'Unnamed party',
    category: draft.category,
    paymentType: draft.paymentType,
    bankName: draft.paymentType === 'Bank' ? draft.bankName.trim() || undefined : undefined,
    date: draft.date,
    vatBill: draft.vatBill,
    discountAmt: totals.discount,
    taxableAmt: totals.taxable,
    subtotalNPR: totals.subtotal,
    vatAmountNPR: totals.vat,
    amountNPR: totals.grandTotal,
    items,
    status: draft.status,
    loggedBy,
    grn: current?.grn,
  };
}

export function draftFromEntry(entry: PurchaseEntry): PurchaseDraft {
  return {
    id: entry.id,
    party: entry.party,
    category: entry.category,
    paymentType: entry.paymentType,
    bankName: entry.bankName ?? '',
    date: entry.date,
    vatBill: entry.vatBill,
    discountAmt: entry.discountAmt ? String(entry.discountAmt) : '',
    status: entry.status,
    lines: linesToDraftLines(entry.items),
  };
}
