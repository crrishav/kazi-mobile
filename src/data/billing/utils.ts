import { RATES, SYM, VAT_RATE } from './mock';
import type { Currency, Invoice, InvoiceStatus } from './types';

export function n0(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}

export function n2(n: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function npr(n: number): string {
  return `रु ${n0(n)}`;
}

export function money(cur: Currency, n: number): string {
  return cur === 'NPR' ? npr(n) : `${SYM[cur]}${n2(n)}`;
}

/** "रु 41.2L" style lakh-compact formatting, matching the design's own `lakh()` helper. */
export function lakh(n: number): string {
  return `रु ${(n / 100000).toFixed(1).replace(/\.0$/, '')}L`;
}

export function short(cur: Currency, n: number): string {
  return cur === 'NPR' ? `रु ${n0(n)}` : `${SYM[cur]}${n0(n)}`;
}

export function subtotal(v: Invoice): number {
  return v.lines.reduce((n, l) => n + l.qty * l.rate, 0);
}

export function vat(v: Invoice): number {
  return v.export ? 0 : (subtotal(v) * VAT_RATE) / 100;
}

export function total(v: Invoice): number {
  return subtotal(v) + vat(v);
}

/** Every payment converted into the invoice's own currency, at the rate it was recorded. */
export function paid(v: Invoice): number {
  return v.payments.reduce((n, p) => {
    if (p.cur === v.cur) return n + p.amt;
    if (p.cur === 'NPR') return n + p.amt / v.rate;
    return n + (p.amt * p.rate) / v.rate;
  }, 0);
}

export function balance(v: Invoice): number {
  return Math.max(0, total(v) - paid(v));
}

export function status(v: Invoice): InvoiceStatus {
  if (v.cancelled) return 'cancelled';
  return balance(v) < 0.5 ? 'collected' : 'accepted';
}

/** NPR equivalent of a foreign-currency amount, always at the invoice's own booked rate (no live-FX toggle in the mobile app). */
export function nprOf(v: Invoice, amountFx: number): number {
  return amountFx * v.rate;
}

export function todaysRate(cur: Currency): number {
  return RATES[cur];
}
