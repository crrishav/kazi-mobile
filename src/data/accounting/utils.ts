import { CHART, EXPENSE_ACCOUNTS, PROFIT_ACCOUNT_ID } from './mock';
import type { AccountSide, ChartNodeKind } from './types';

export function fmt(n: number): string {
  return Math.abs(n).toLocaleString('en-US');
}

/** Negative balances render in parentheses — contra accounts (accum. depreciation) stay visible, never netted away. */
export function signed(n: number): string {
  return n < 0 ? `(${fmt(n)})` : fmt(n);
}

export function money(n: number): string {
  return `रु ${fmt(n)}`;
}

export function getAccountLabel(id: string): string {
  const chart = CHART.find((c) => c.id === id);
  if (chart) return chart.label;
  const expense = EXPENSE_ACCOUNTS.find((x) => x.id === id);
  return expense?.label ?? '';
}

export function getAccountCode(id: string): string {
  const chart = CHART.find((c) => c.id === id);
  if (chart) return chart.code ?? '';
  const expense = EXPENSE_ACCOUNTS.find((x) => x.id === id);
  return expense?.code ?? '';
}

export function isExpenseAccount(id: string): boolean {
  return EXPENSE_ACCOUNTS.some((x) => x.id === id);
}

export function accountSide(id: string): AccountSide {
  if (isExpenseAccount(id)) return 'debit';
  return CHART.find((c) => c.id === id)?.side ?? 'debit';
}

export function accountBalance(id: string, adjustments: Record<string, number>): number {
  const chart = CHART.find((c) => c.id === id);
  const base = chart ? (chart.amount ?? 0) : (EXPENSE_ACCOUNTS.find((x) => x.id === id)?.amount ?? 0);
  return base + (adjustments[id] ?? 0);
}

/** Recursively sums a group's descendants — leaves contribute their balance, subgroups their own total. */
export function groupTotal(id: string, adjustments: Record<string, number>): number {
  return CHART.filter((c) => c.parent === id).reduce(
    (n, c) => n + (c.kind === 'leaf' ? accountBalance(c.id, adjustments) : groupTotal(c.id, adjustments)),
    0,
  );
}

export interface ChartRowModel {
  id: string;
  kind: ChartNodeKind;
  code: string;
  label: string;
  depth: number;
  isTop: boolean;
  amount: number;
  open: boolean;
}

/** Flattens the chart into the currently-visible rows, respecting each ancestor group's collapsed state. */
export function visibleChartRows(open: Record<string, boolean>, adjustments: Record<string, number>): ChartRowModel[] {
  const isVisible = (parentId: string | undefined): boolean => {
    let currentId = parentId;
    while (currentId) {
      const p = CHART.find((c) => c.id === currentId);
      if (!p || !open[p.id]) return false;
      currentId = p.parent;
    }
    return true;
  };

  return CHART.filter((node) => isVisible(node.parent)).map((node) => {
    const isTop = node.kind === 'group' && node.depth === 0;
    return {
      id: node.id,
      kind: node.kind,
      code: node.code ?? '',
      label: isTop ? node.label.toUpperCase() : node.label,
      depth: node.depth ?? 0,
      isTop,
      amount: node.kind === 'group' ? groupTotal(node.id, adjustments) : accountBalance(node.id, adjustments),
      open: !!open[node.id],
    };
  });
}

/** Mirrors the source prototype's `save()`: posts both legs, and — if either touches an expense account —
 *  mirrors that P&L movement into the profit-for-the-year equity account so the sheet stays balanced. */
export function applyEntry(adjustments: Record<string, number>, debitAcct: string, creditAcct: string, amount: number): Record<string, number> {
  const delta: Record<string, number> = {};
  delta[debitAcct] = (adjustments[debitAcct] ?? 0) + (accountSide(debitAcct) === 'debit' ? amount : -amount);
  delta[creditAcct] = (adjustments[creditAcct] ?? 0) + (accountSide(creditAcct) === 'credit' ? amount : -amount);

  let profit = 0;
  if (isExpenseAccount(debitAcct)) profit -= amount;
  if (isExpenseAccount(creditAcct)) profit += amount;
  if (profit) delta[PROFIT_ACCOUNT_ID] = (adjustments[PROFIT_ACCOUNT_ID] ?? 0) + profit;

  return { ...adjustments, ...delta };
}
