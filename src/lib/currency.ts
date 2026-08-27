/**
 * Dual-currency support. Kazi ops span Nepal (NPR) and the UK (GBP); the
 * reference web app carries a single `GBP_RATE` constant and renders every
 * money value in the user's preferred currency with the other shown muted
 * alongside it. This module is the pure/formatting half of that — the
 * React state (which currency is "primary", persisted) lives in
 * `currency-context.tsx`.
 *
 * Mock-era simplification: one fixed rate, no live FX. Billing's per-invoice
 * booked rate and the live-rate popover (plan 2.3) layer on top later; they
 * do not change this contract.
 */

export type Currency = 'NPR' | 'GBP';

/** Matches the reference app's `GBP_RATE` in `src/constants.js`. 1 GBP = 200 NPR. */
export const GBP_RATE = 200;

export const CURRENCY_SYMBOL: Record<Currency, string> = {
  NPR: 'रु',
  GBP: '£',
};

export function toGBP(npr: number): number {
  return npr / GBP_RATE;
}

export function toNPR(value: number, from: Currency): number {
  return from === 'GBP' ? value * GBP_RATE : value;
}

/** Convert any amount between the two currencies. `convert(x, 'NPR', 'NPR')` is a no-op. */
export function convert(value: number, from: Currency, to: Currency): number {
  if (from === to) return value;
  return to === 'GBP' ? toGBP(value) : toNPR(value, from);
}

/**
 * Format an amount that is *already in* `cur`. NPR is whole-rupee with Nepali
 * lakh grouping (१,२३,४५६ style digits stay Latin) and the `रु` glyph the
 * design uses; GBP shows pence only when the amount isn't round.
 */
export function asCurrency(value: number, cur: Currency): string {
  if (cur === 'NPR') {
    return `${CURRENCY_SYMBOL.NPR} ${Math.round(value).toLocaleString('en-IN')}`;
  }
  const rounded = Math.abs(value - Math.round(value)) < 0.005;
  return `${CURRENCY_SYMBOL.GBP}${value.toLocaleString('en-GB', {
    minimumFractionDigits: rounded ? 0 : 2,
    maximumFractionDigits: rounded ? 0 : 2,
  })}`;
}

/**
 * Compact "रु 41.2L" / "£20.6k" formatting for KPI tiles and chart labels,
 * matching the per-module `lakh()` / `short()` helpers the design shipped.
 */
export function asCompactCurrency(value: number, cur: Currency): string {
  if (cur === 'NPR') {
    if (Math.abs(value) < 100000) return `${CURRENCY_SYMBOL.NPR} ${Math.round(value).toLocaleString('en-IN')}`;
    return `${CURRENCY_SYMBOL.NPR} ${(value / 100000).toFixed(1).replace(/\.0$/, '')}L`;
  }
  if (Math.abs(value) < 1000) return asCurrency(value, 'GBP');
  if (Math.abs(value) < 1000000) return `${CURRENCY_SYMBOL.GBP}${(value / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  return `${CURRENCY_SYMBOL.GBP}${(value / 1000000).toFixed(2).replace(/\.00$/, '')}m`;
}

export interface MoneyParts {
  /** The amount in the user's preferred currency, formatted. */
  primary: string;
  /** The same amount in the other currency, formatted — shown muted next to `primary`. */
  secondary: string;
}

/**
 * Given an NPR amount and the user's preferred currency, produce both the
 * primary and secondary display strings.
 */
export function moneyParts(npr: number, primaryCurrency: Currency, compact = false): MoneyParts {
  const fmt = compact ? asCompactCurrency : asCurrency;
  if (primaryCurrency === 'GBP') {
    return { primary: fmt(toGBP(npr), 'GBP'), secondary: fmt(npr, 'NPR') };
  }
  return { primary: fmt(npr, 'NPR'), secondary: fmt(toGBP(npr), 'GBP') };
}
