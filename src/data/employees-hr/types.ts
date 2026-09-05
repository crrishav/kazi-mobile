import type { AvatarTint } from '@/components/ui/avatar';

export type EmployeeView = 'directory' | 'payroll';
export type SheetMode = 'add' | 'edit' | null;
export type MonthKey = 'aug' | 'jul' | 'jun';
/** `people.location` — the Nepal factory or the UK arm. '' when never set. */
export type EmployeeLocation = 'nepal' | 'uk' | '';

/** A row of the live `positions` table — the only thing that grants access. */
export interface Position {
  id: string;
  label: string;
  tier: number;
}

/** A different start/end on one weekday — the reference app's "day exceptions". */
export type ScheduleOverrides = Record<string, { start: string; end: string }>;

/** The shift kept on the employee record; drives Attendance's late-arrival flag. */
export interface EmployeeSchedule {
  start: string;
  end: string;
  workingDays: string[];
  dayOverrides: ScheduleOverrides;
}

export interface Employee {
  id: number;
  code: string;
  name: string;
  /** The position's display label. Derived from `positionId`; never written. */
  role: string;
  /** `positions.id` — what the permission matrix is keyed on. */
  positionId: string;
  dept: string;
  active: boolean;
  joined: string;
  left?: string;
  /** Manager's employee id — the reporting line, editable from the sheet. */
  reportsTo?: number;
  email: string;
  phone: string;
  address: string;
  pan: string;
  location: EmployeeLocation;
  productionWorker: boolean;
  schedule?: EmployeeSchedule;
  bank: string;
  acct: string;
  branch: string;
  basic: number;
  allow: number;
  otH: number;
  otR: number;
  bonus: number;
  adv: number;
  absent: number;
  late: number;
  tax: number;
  avatarInitials: string;
  avatarTint: AvatarTint;
}

export interface PayMonth {
  key: MonthKey;
  label: string;
  period: string;
  days: number;
  factor: number;
  open: boolean;
  payDate: string;
}

export interface PayResult {
  ot: number;
  otHours: number;
  cut: number;
  gross: number;
  ssf: number;
  ded: number;
  net: number;
  absent: number;
  late: number;
}

export interface EmployeeDraft {
  id: number | null;
  name: string;
  positionId: string;
  dept: string;
  email: string;
  phone: string;
  /** AD ISO `YYYY-MM-DD`, matching the reference app's date input. */
  joinDate: string;
  pan: string;
  address: string;
  location: EmployeeLocation;
  /** Manager's employee id, or null for "no manager". */
  reportsTo: number | null;
  productionWorker: boolean;
  /** 24-hour `HH:MM`; blank leaves the column unset. */
  scheduleStart: string;
  scheduleEnd: string;
  scheduleWorkingDays: string[];
  scheduleOverrides: ScheduleOverrides;
  bank: string;
  acct: string;
  branch: string;
  basic: string;
  active: boolean;
}
