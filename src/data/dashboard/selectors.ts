/**
 * Pure derivations for the three role-based dashboard variants. Each takes the
 * already-fetched module arrays (any of which may be `undefined` while loading
 * or `[]` when a Firestore read was denied) and always returns a fully-formed,
 * zero-filled result — the screen can render immediately and fill in.
 */
import { paid as invoicePaid, balance as invoiceBalance, isOverdue, nprOf, statusFull } from '@/data/billing/utils';
import type { Invoice } from '@/data/billing/types';
import type { Expense } from '@/data/finance/types';
import type { StockItem } from '@/data/inventory/types';
import type { QcLog } from '@/data/quality-control/types';
import { STAGES } from '@/data/sales/mock';
import type { Order } from '@/data/sales/types';
import type { Task } from '@/data/tasks/types';
import type { TeamMember } from '@/data/attendance/types';

import type {
  AttendanceBreakdown,
  DashKpi,
  DirectorDashboard,
  LowStockRow,
  MyDayDashboard,
  OpsDashboard,
  StageDatum,
  TaskBoardCounts,
} from './types';

const TASK_TARGET = 10;

const thisMonth = (): string => new Date().toISOString().slice(0, 7);

/** "रु 41.2L" above a lakh, plain grouped rupees below it. */
function compactNpr(n: number): string {
  if (n >= 100_000) return `रु ${(n / 100_000).toFixed(1).replace(/\.0$/, '')}L`;
  return `रु ${Math.round(n).toLocaleString('en-US')}`;
}

function firstName(name: string | undefined): string {
  return (name ?? '').trim().split(/\s+/)[0]?.toLowerCase() ?? '';
}

/** Loose first-name match — mock rosters use first names, real profiles carry a full name. */
function samePerson(a: string, b: string): boolean {
  if (!a || !b) return false;
  return a === b || a.startsWith(b) || b.startsWith(a);
}

function attendanceBreakdown(roster: TeamMember[] | undefined): {
  breakdown: AttendanceBreakdown;
  onRoll: number;
} {
  const list = roster ?? [];
  const breakdown: AttendanceBreakdown = { present: 0, late: 0, absent: 0, leave: 0 };
  for (const m of list) {
    if (m.status === 'present' || m.status === 'half') breakdown.present += 1;
    else if (m.status === 'late') breakdown.late += 1;
    else if (m.status === 'absent') breakdown.absent += 1;
    else if (m.status === 'leave') breakdown.leave += 1;
  }
  return { breakdown, onRoll: list.length };
}

function orderStages(orders: Order[] | undefined): { stages: StageDatum[]; activeTotal: number } {
  const active = (orders ?? []).filter((o) => o.status === 'active');
  const stages = STAGES.map((s) => ({
    id: s.id,
    label: s.short,
    count: active.filter((o) => o.stage === s.id).length,
  }));
  return { stages, activeTotal: active.length };
}

function qcPassRate(logs: QcLog[] | undefined): number {
  const list = logs ?? [];
  const checked = list.reduce((n, l) => n + (l.checkedCount || 0), 0);
  const passed = list.reduce((n, l) => n + (l.passedCount || 0), 0);
  return checked ? (passed / checked) * 100 : 0;
}

function lowStockRows(stock: StockItem[] | undefined): LowStockRow[] {
  return (stock ?? [])
    .filter((i) => i.qty <= i.threshold)
    .map((i) => ({ id: i.id, name: i.name, qty: i.qty, threshold: i.threshold, unit: i.unit }));
}

function financeMTD(expenses: Expense[] | undefined): number {
  const m = thisMonth();
  return (expenses ?? [])
    .filter((e) => (e.date || '').slice(0, 7) === m)
    .reduce((n, e) => n + (e.amountNPR || 0), 0);
}

function taskBoardCounts(tasks: Task[] | undefined): { counts: TaskBoardCounts; openTotal: number } {
  const list = tasks ?? [];
  const counts: TaskBoardCounts = {
    blocked: list.filter((t) => t.status === 'blocked').length,
    progress: list.filter((t) => t.status === 'progress').length,
    inactive: list.filter((t) => t.status === 'inactive').length,
    done: list.filter((t) => t.status === 'done').length,
  };
  return { counts, openTotal: counts.blocked + counts.progress + counts.inactive };
}

// ---- Ops (nepal_admin / super_admin) ---------------------------------------

export function deriveOps(input: {
  orders?: Order[];
  tasks?: Task[];
  roster?: TeamMember[];
  qcLogs?: QcLog[];
  stock?: StockItem[];
  expenses?: Expense[];
  canViewFinance: boolean;
}): OpsDashboard {
  const { breakdown, onRoll } = attendanceBreakdown(input.roster);
  const { stages, activeTotal } = orderStages(input.orders);
  const { counts, openTotal } = taskBoardCounts(input.tasks);
  const low = lowStockRows(input.stock);
  const rate = qcPassRate(input.qcLogs);
  const mtd = financeMTD(input.expenses);

  const kpis: DashKpi[] = [
    {
      id: 'staff-today',
      label: 'Staff in today',
      value: `${breakdown.present + breakdown.late}`,
      context: onRoll ? `of ${onRoll}` : undefined,
      route: '/attendance',
      section: 'attendance',
    },
    {
      id: 'active-orders',
      label: 'Active orders',
      value: `${activeTotal}`,
      route: '/production',
      section: 'production',
    },
    {
      id: 'open-tasks',
      label: 'Open tasks',
      value: `${openTotal}`,
      delta: counts.blocked ? { tone: 'bad', text: `${counts.blocked} blocked` } : undefined,
      route: '/tasks',
      section: 'tasks',
    },
    {
      id: 'qc-rate',
      label: 'QC pass rate',
      value: `${rate.toFixed(1)}%`,
      route: '/quality-control',
      section: 'quality-control',
    },
  ];
  if (input.canViewFinance) {
    kpis.push({
      id: 'finance-mtd',
      label: 'Spend · MTD',
      value: compactNpr(mtd),
      route: '/finance',
      section: 'finance',
    });
  }

  return {
    kpis,
    stages,
    activeOrdersTotal: activeTotal,
    attendance: breakdown,
    attendanceOnRoll: onRoll,
    taskBoard: counts,
    openTasksTotal: openTotal,
    lowStock: low,
    financeMTD: mtd,
  };
}

// ---- Director (uk_admin) -------------------------------------------------------

export function deriveDirector(input: {
  invoices?: Invoice[];
  orders?: Order[];
  roster?: TeamMember[];
}): DirectorDashboard {
  const invoices = (input.invoices ?? []).filter((v) => !v.cancelled);

  let paidNPR = 0;
  let outstandingNPR = 0;
  let overdueNPR = 0;
  const invoiceCounts = { paid: 0, partial: 0, overdue: 0, draft: 0 };

  for (const v of invoices) {
    // All-time collected (reference `totalPaidNPR`) — seed/live invoices don't
    // reliably carry an ISO issue date to filter month-to-date on.
    paidNPR += nprOf(v, invoicePaid(v));
    outstandingNPR += nprOf(v, invoiceBalance(v));
    if (isOverdue(v)) overdueNPR += nprOf(v, invoiceBalance(v));

    const s = statusFull(v);
    if (s === 'Paid') invoiceCounts.paid += 1;
    else if (s === 'Partial') invoiceCounts.partial += 1;
    else if (s === 'Overdue') invoiceCounts.overdue += 1;
    else if (s === 'Draft') invoiceCounts.draft += 1;
  }

  const { stages, activeTotal } = orderStages(input.orders);
  const { breakdown, onRoll } = attendanceBreakdown(input.roster);

  const kpis: DashKpi[] = [
    {
      id: 'revenue-paid',
      label: 'Revenue · collected',
      value: compactNpr(paidNPR),
      route: '/finance',
      section: 'finance',
    },
    {
      id: 'outstanding',
      label: 'Outstanding',
      value: compactNpr(outstandingNPR),
      delta:
        overdueNPR > 0
          ? { tone: 'bad', text: `${compactNpr(overdueNPR)} overdue` }
          : { tone: 'good', text: 'none overdue' },
      route: '/billing',
      section: 'billing',
    },
    {
      id: 'active-orders',
      label: 'Active orders',
      value: `${activeTotal}`,
      route: '/production',
      section: 'production',
    },
    {
      id: 'staff-today',
      label: 'Staff in today',
      value: `${breakdown.present + breakdown.late}`,
      context: onRoll ? `of ${onRoll}` : undefined,
      route: '/attendance',
      section: 'attendance',
    },
  ];

  return {
    kpis,
    invoices: { paidNPR, outstandingNPR, overdueNPR },
    invoiceCounts,
    stages,
    activeOrdersTotal: activeTotal,
    attendance: breakdown,
    attendanceOnRoll: onRoll,
  };
}

// ---- My day (employee / nepal_staff) ----------------------------------------

export function deriveMyDay(input: {
  tasks?: Task[];
  roster?: TeamMember[];
  expenses?: Expense[];
  myName: string;
  canViewFinance: boolean;
}): MyDayDashboard {
  const me = firstName(input.myName);

  // `tasks.assignee` is a display name, so this now matches the real person
  // rather than a stand-in roster id.
  const mine = (input.tasks ?? []).filter((t) => !!t.assignee && samePerson(firstName(t.assignee), me));
  const myTasks = mine
    .filter((t) => t.status !== 'done')
    .map((t) => ({ id: t.id, title: t.title, due: t.due, status: t.status }));
  const tasksDone = mine.filter((t) => t.status === 'done').length;

  const rosterMe = (input.roster ?? []).find((m) => samePerson(firstName(m.name), me));
  const month = rosterMe?.month;

  return {
    myTasks,
    myOpenCount: myTasks.length,
    attendanceMonth: {
      present: month?.present ?? 0,
      late: month?.late ?? 0,
      leave: month?.leave ?? 0,
      absent: month?.absent ?? 0,
    },
    tasksDone,
    taskTarget: TASK_TARGET,
    financeMTD: input.canViewFinance ? financeMTD(input.expenses) : 0,
  };
}
