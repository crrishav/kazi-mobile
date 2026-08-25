import type { AvatarTint } from '@/components/ui/avatar';

export type AttendanceView = 'mine' | 'team';
export type AttendanceStatus = 'present' | 'late' | 'absent' | 'half' | 'leave';
export type TeamFilter = 'all' | AttendanceStatus;

export interface ClockStatus {
  clockedIn: boolean;
  inTime: string;
  outTime: string | null;
  elapsedSeconds: number;
}

export interface DayCell {
  day: number | null;
  status: AttendanceStatus | 'off' | 'future' | null;
  isToday: boolean;
}

export interface TeamMember {
  id: number;
  name: string;
  role: string;
  initials: string;
  avatarTint: AvatarTint;
  status: AttendanceStatus;
  times: string;
  hours: string;
}

export interface MySummary {
  hoursWorked: string;
  overtime: string;
  lateMarks: number;
  lateAllowed: number;
  absentDays: number;
  leaveTaken: number;
  leaveAllowed: number;
  deduction: number;
  deductionNote: string;
}

export interface RollCallTotals {
  onRoll: number;
  present: number;
  late: number;
  absent: number;
  half: number;
  leave: number;
}

export interface TeamMonthStats {
  lineLabel: string;
  teamHours: string;
  attendanceCuts: number;
}
