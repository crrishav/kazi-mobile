import type { AvatarTint } from '@/components/ui/avatar';

export type AttendanceView = 'mine' | 'team';
export type AttendanceStatus = 'present' | 'late' | 'absent' | 'half' | 'leave';
export type TeamFilter = 'all' | AttendanceStatus;

export interface ClockStatus {
  clockedIn: boolean;
  inTime: string;
  outTime: string | null;
  elapsedSeconds: number;
  /** GPS context for the current (or most recent) clock-in — set by item 26. */
  lastPunch?: PunchSummary;
}

/** The geofence + late-cut outcome carried on `ClockStatus` for display. */
export interface PunchSummary {
  /** Metres to the workshop, or null when no fix was captured (bypass / permission denied). */
  distanceToSiteM: number | null;
  /** Reported accuracy radius of the fix, or null when none was captured. */
  accuracyM: number | null;
  bypassUsed: boolean;
  status: 'Present' | 'Late';
  lateMinutes: number;
  lateCutApplied: boolean;
}

/** A raw GPS clock-in/out punch — reference `clock_ins` collection (item 26). */
export interface ClockPunch extends PunchSummary {
  id: string;
  staffName: string;
  /** YYYY-MM-DD (local). */
  date: string;
  /** ISO timestamp of the clock-in. */
  clockedInAt: string;
  /** ISO timestamp of the matching clock-out, null while still on the clock. */
  clockedOutAt: string | null;
  lat: number | null;
  lng: number | null;
}

export interface DayCell {
  day: number | null;
  status: AttendanceStatus | 'off' | 'future' | null;
  isToday: boolean;
}

/** Month-to-date tallies for one staffer (item 27 employee report). */
export interface MemberMonth {
  present: number;
  late: number;
  absent: number;
  half: number;
  leave: number;
  otHours: string;
  hoursMTD: string;
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
  month: MemberMonth;
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
