export function initials(name: string): string {
  return name
    .split(/[\s&]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

/** "रु 43.2L" style lakh-compact formatting, matching the design's own `lakh()` helper. */
export function lakh(n: number): string {
  return `रु ${(n / 100000).toFixed(1).replace(/\.0$/, '')}L`;
}
