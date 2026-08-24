import { PRIORITY } from './mock';
import type { Priority } from './types';

/** 3-bar priority meter — bars up to the priority's rank take its hue, the rest take `offColor`. */
export function priorityBarColors(priority: Priority, offColor: string): [string, string, string] {
  const { rank, hue } = PRIORITY[priority];
  return [rank >= 1 ? hue : offColor, rank >= 2 ? hue : offColor, rank >= 3 ? hue : offColor];
}

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
