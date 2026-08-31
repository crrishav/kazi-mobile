import type { SectionId } from '@/auth/permissions';
import type { DeltaArrow, DeltaTone } from '@/components/ui/kpi-card';
import type { TaskStatus } from '@/data/tasks/types';

/** One KPI tile on a dashboard variant. `route` + `section` make it tappable and permission-gated. */
export interface DashKpi {
  id: string;
  label: string;
  value: string;
  delta?: { arrow?: DeltaArrow; tone: DeltaTone; text: string };
  context?: string;
  sparkline?: number[];
  /** expo-router path to open on tap. */
  route?: string;
  /** RBAC section that guards `route` — tile is hidden when the user can't view it. */
  section?: SectionId;
}

/** A slice of the "orders by stage" bar (kept name-compatible with the existing card). */
export interface StageDatum {
  id: string;
  label: string;
  count: number;
  blockedCount?: number;
}

export interface AttendanceBreakdown {
  present: number;
  late: number;
  absent: number;
  leave: number;
}

export interface TaskBoardCounts {
  blocked: number;
  progress: number;
  inactive: number;
  done: number;
}

export interface LowStockRow {
  id: string;
  name: string;
  qty: number;
  threshold: number;
  unit: string;
}

/** `nepal_admin` / `super_admin` — factory-floor operations. */
export interface OpsDashboard {
  kpis: DashKpi[];
  stages: StageDatum[];
  activeOrdersTotal: number;
  attendance: AttendanceBreakdown;
  attendanceOnRoll: number;
  taskBoard: TaskBoardCounts;
  openTasksTotal: number;
  lowStock: LowStockRow[];
  financeMTD: number;
}

/** `uk_admin` — money and the big picture. */
export interface DirectorDashboard {
  kpis: DashKpi[];
  invoices: { paidNPR: number; outstandingNPR: number; overdueNPR: number };
  invoiceCounts: { paid: number; partial: number; overdue: number; draft: number };
  stages: StageDatum[];
  activeOrdersTotal: number;
  attendance: AttendanceBreakdown;
  attendanceOnRoll: number;
}

export interface MyDayTask {
  id: string;
  title: string;
  ref: string;
  status: TaskStatus;
}

/** `employee` / `nepal_staff` — just their own day. */
export interface MyDayDashboard {
  myTasks: MyDayTask[];
  myOpenCount: number;
  attendanceMonth: { present: number; late: number; leave: number; absent: number };
  tasksDone: number;
  taskTarget: number;
  financeMTD: number;
}
