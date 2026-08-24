export function fmt(n: number): string {
  return n.toLocaleString('en-US');
}

/** "रु 41.2L" style lakh-compact formatting, matching the design's own `lakh()` helper. */
export function lakh(n: number): string {
  return `रु ${(n / 100000).toFixed(1).replace(/\.0$/, '')}L`;
}

export function rupees(n: number): string {
  return `रु ${fmt(n)}`;
}
