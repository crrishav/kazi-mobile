import type { DeltaArrow, DeltaTone } from '@/components/ui/kpi-card';

export interface KpiDatum {
  id: string;
  label: string;
  value: string;
  delta?: { arrow: DeltaArrow; tone: DeltaTone; text: string };
  context?: string;
  sparkline: number[];
}

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

export interface DashboardSummary {
  userName: string;
  roleLine: string;
  unreadNotifications: number;
  activeOrdersTotal: number;
  stages: StageDatum[];
  attendance: AttendanceBreakdown;
  attendanceOnRoll: number;
  kpis: KpiDatum[];
  updatedAgo: string;
}
