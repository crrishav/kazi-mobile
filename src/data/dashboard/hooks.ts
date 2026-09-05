/**
 * Role-based dashboard data. Each hook composes the existing per-module query
 * hooks and derives its variant's shape with a pure selector. React Query keeps
 * every underlying query cached, so one slow module never blanks the others.
 * A FAILED module is different: its selector input would be `undefined` and the
 * derived figures would silently read as zero, so `combine` surfaces `isError`
 * and the variants refuse to draw.
 */
import { useMemo } from 'react';

import { useAuth } from '@/auth/auth-context';
import { useTeamRoster } from '@/data/attendance/hooks';
import { useInvoices } from '@/data/billing/hooks';
import { useExpenses } from '@/data/finance/hooks';
import { useStock } from '@/data/inventory/hooks';
import { useEntries } from '@/data/marketing/hooks';
import { useOrders } from '@/data/sales/hooks';
import { useTasks } from '@/data/tasks/hooks';

import {
  deriveAccountant,
  deriveDesigner,
  deriveDirector,
  deriveMarketing,
  deriveMyDay,
  deriveOps,
} from './selectors';

/** Structurally satisfied by any `UseQueryResult`, and by `GateQuery`. */
interface QueryLike {
  isLoading: boolean;
  isRefetching: boolean;
  isError: boolean;
  isPending: boolean;
  isFetching: boolean;
  error: unknown;
  data: unknown;
  refetch: () => unknown;
}

function combine(queries: QueryLike[]) {
  return {
    isLoading: queries.some((q) => q.isLoading),
    isRefetching: queries.some((q) => q.isRefetching),
    // A selector fed `undefined` derives zeros, which read as real figures —
    // "0 overdue invoices" is a claim, not a blank. So a failed module has to
    // stop the variant rendering rather than quietly flatten it.
    isError: queries.some((q) => q.isError && q.data === undefined),
    error: queries.find((q) => q.isError)?.error ?? null,
    refetch: () => Promise.all(queries.map((q) => q.refetch())),
    /** Handed to `<ScreenGate>` so it can show the failure and retry it. */
    queries,
  };
}

export function useOpsDashboard() {
  const { canView } = useAuth();
  const orders = useOrders();
  const tasks = useTasks();
  const roster = useTeamRoster();
  const stock = useStock();
  const expenses = useExpenses();
  const canViewFinance = canView('finance');

  const data = useMemo(
    () =>
      deriveOps({
        orders: orders.data,
        tasks: tasks.data,
        roster: roster.data,
        stock: stock.data,
        expenses: expenses.data,
        canViewFinance,
      }),
    [orders.data, tasks.data, roster.data, stock.data, expenses.data, canViewFinance],
  );

  return { data, ...combine([orders, tasks, roster, stock, expenses]) };
}

export function useDirectorDashboard() {
  const invoices = useInvoices();
  const orders = useOrders();
  const roster = useTeamRoster();

  const data = useMemo(
    () => deriveDirector({ invoices: invoices.data, orders: orders.data, roster: roster.data }),
    [invoices.data, orders.data, roster.data],
  );

  return { data, ...combine([invoices, orders, roster]) };
}

export function useMyDayDashboard() {
  const { profile, canView } = useAuth();
  const tasks = useTasks();
  const roster = useTeamRoster();
  const expenses = useExpenses();
  const myName = profile?.name ?? '';
  const canViewFinance = canView('finance');

  const data = useMemo(
    () =>
      deriveMyDay({
        tasks: tasks.data,
        roster: roster.data,
        expenses: expenses.data,
        myName,
        canViewFinance,
      }),
    [tasks.data, roster.data, expenses.data, myName, canViewFinance],
  );

  return { data, ...combine([tasks, roster, expenses]) };
}

export function useAccountantDashboard() {
  const invoices = useInvoices();
  const expenses = useExpenses();

  const data = useMemo(
    () => deriveAccountant({ invoices: invoices.data, expenses: expenses.data }),
    [invoices.data, expenses.data],
  );

  return { data, ...combine([invoices, expenses]) };
}

export function useDesignerDashboard() {
  const { profile } = useAuth();
  const tasks = useTasks();
  const orders = useOrders();
  const stock = useStock();
  const myName = profile?.name ?? '';

  const data = useMemo(
    () => deriveDesigner({ tasks: tasks.data, orders: orders.data, stock: stock.data, myName }),
    [tasks.data, orders.data, stock.data, myName],
  );

  return { data, ...combine([tasks, orders, stock]) };
}

export function useMarketingDashboard() {
  const { profile } = useAuth();
  const tasks = useTasks();
  const entries = useEntries();
  const myName = profile?.name ?? '';

  const data = useMemo(
    () => deriveMarketing({ tasks: tasks.data, entries: entries.data, myName }),
    [tasks.data, entries.data, myName],
  );

  return { data, ...combine([tasks, entries]) };
}
