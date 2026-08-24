import type { Customer } from './types';

export function initials(name: string): string {
  return name
    .split(/[\s&.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export function gbp(n: number): string {
  return `£${n.toLocaleString()}`;
}

export function owed(c: Customer): number {
  return c.invoices.filter((i) => i.status !== 'paid').reduce((n, i) => n + i.amount, 0);
}

export function lifetime(c: Customer): number {
  return c.invoices.reduce((n, i) => n + i.amount, 0);
}

export function hasOverdue(c: Customer): boolean {
  return c.invoices.some((i) => i.status === 'overdue');
}
