/**
 * Role-based dashboard data. Each hook composes the existing per-module query
 * hooks and derives its variant's shape with a pure selector. React Query keeps
 * every underlying query cached and isolates a failed / permission-denied read
 * per key, so one empty module never blanks the dashboard.
 */
import { useMemo } from 'react';

import { useAuth } from '@/auth/auth-context';
import { useTeamRoster } from '@/data/attendance/hooks';
import { useInvoices } from '@/data/billing/hooks';
import { useExpenses } from '@/data/finance/hooks';
import { useStock } from '@/data/inventory/hooks';
import { useQcLogs } from '@/data/quality-control/hooks';
import { useOrders } from '@/data/sales/hooks';
import { useTasks } from '@/data/tasks/hooks';

import { deriveDirector, deriveMyDay, deriveOps } from './selectors';

interface QueryLike {
  isLoading: boolean;
  isRefetching: boolean;
  refetch: () => unknown;
}

function combine(queries: QueryLike[]) {
  return {
    isLoading: queries.some((q) => q.isLoading),
    isRefetching: queries.some((q) => q.isRefetching),
    refetch: () => Promise.all(queries.map((q) => q.refetch())),
  };
}

export function useOpsDashboard() {
  const { canView } = useAuth();
  const orders = useOrders();
  const tasks = useTasks();
  const roster = useTeamRoster();
  const qc = useQcLogs();
  const stock = useStock();
  const expenses = useExpenses();
  const canViewFinance = canView('finance');

  const data = useMemo(
    () =>
      deriveOps({
        orders: orders.data,
        tasks: tasks.data,
        roster: roster.data,
        qcLogs: qc.data,
        stock: stock.data,
        expenses: expenses.data,
        canViewFinance,
      }),
    [orders.data, tasks.data, roster.data, qc.data, stock.data, expenses.data, canViewFinance],
  );

  return { data, ...combine([orders, tasks, roster, qc, stock, expenses]) };
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
