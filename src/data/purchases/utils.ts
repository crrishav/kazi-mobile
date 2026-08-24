export function fmt(n: number): string {
  return n.toLocaleString('en-US');
}

export function money(n: number): string {
  return `रु ${fmt(n)}`;
}

/** "रु 1.9L" style lakh-compact formatting, matching the design's own `short()` helper. */
export function short(n: number): string {
  return n >= 100000 ? `रु ${(n / 100000).toFixed(1).replace(/\.0$/, '')}L` : `रु ${fmt(n)}`;
}
