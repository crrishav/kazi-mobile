import type { AvatarTint } from '@/components/ui/avatar';

export type EmployeeView = 'directory' | 'payroll';
export type SheetMode = 'add' | 'edit' | null;
export type MonthKey = 'aug' | 'jul' | 'jun';

export interface Employee {
  id: number;
  code: string;
  name: string;
  role: string;
  dept: string;
  active: boolean;
  joined: string;
  left?: string;
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
  role: string;
  dept: string;
  bank: string;
  acct: string;
  branch: string;
  basic: string;
  active: boolean;
}
