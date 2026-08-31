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
  /** `YYYY-MM-DD`, or null for the leading blanks that pad the first week. */
  dateISO: string | null;
  status: AttendanceStatus | 'off' | 'future' | null;
  isToday: boolean;
}

/**
 * One day of one person's attendance, as the reference app's month report shows
 * it: the `attendance` row's status and the `clock_ins` row's real punch times.
 */
export interface DayDetail {
  /** `YYYY-MM-DD`. */
  date: string;
  /** e.g. "Sun 31 Aug". */
  label: string;
  /** Null when there's no `attendance` row for the day. */
  status: AttendanceStatus | null;
  /** `HH:MM` in Asia/Kathmandu, null when the person never punched in. */
  clockIn: string | null;
  /** `HH:MM`, null while still on the clock or when never punched. */
  clockOut: string | null;
  /** Real clocked duration in hours, null when there's no closed punch. */
  workedHours: number | null;
  /** The shift length rostered for that weekday, 0 on a weekly off. */
  scheduledHours: number;
  /** Shift window for the day, e.g. "09:00–17:00"; null on a weekly off. */
  shiftLabel: string | null;
  lateMinutes: number;
  /** 15+ minutes late → 25% of that day's salary forfeited (reference rule). */
  lateCutApplied: boolean;
  note: string;
  /** Metres from the workshop when the punch carried a GPS fix. */
  distanceToSiteM: number | null;
  /** True when the weekday isn't in the person's working days. */
  isWeeklyOff: boolean;
}

/** A staffer's rostered week, as stored on their `employees` doc. */
export interface WorkSchedule {
  /** `HH:MM`. */
  start: string;
  /** `HH:MM`. */
  end: string;
  /** Short weekday names, e.g. `['Sun','Mon','Tue','Wed','Thu','Fri']`. */
  workingDays: string[];
  /** Per-weekday exceptions, e.g. `{ Tue: { start: '09:30', end: '15:30' } }`. */
  dayOverrides: Record<string, { start?: string; end?: string }>;
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
  /** Primary `staffId` — the one a status edit is written under. */
  staffId: string;
  /** Every `staffId` this person's rows are filed under (the live data has duplicates). */
  staffIds: string[];
  /** `employees` doc id, when the staffer has a directory entry (schedule edits need it). */
  employeeDocId: string | null;
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
  /** NPR forfeited to late cuts. 0 when there are no cuts *or* no salary on file. */
  deduction: number;
  /** Days marked Late with the 25% cut applied — the card shows whenever this is > 0. */
  deductionDays: number;
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

/** One calendar week's logged hours vs its target — the "Mine" weekly bar chart. */
export interface WeekHours {
  label: string;
  hours: number;
  target: number;
}

/**
 * Everything the "Mine" view's month blocks render: the calendar grid, the
 * weekly bars and the monthly summary, all derived from the signed-in user's
 * own `attendance` / `clock_ins` / `finance_payroll` rows.
 */
export interface MyMonth {
  /** e.g. "August 2026". */
  monthLabel: string;
  /** AD ISO span of the displayed month — feeds the calendar's BS sub-label. */
  monthISOStart: string;
  monthISOEnd: string;
  /** Scheduled working days in the month (weekly offs excluded). */
  workingDays: number;
  /** The signed-in user's shift window, e.g. "09:00–17:00". */
  shiftLabel: string;
  /** Day-of-month for today, or 0 when the displayed month isn't the current one. */
  todayDay: number;
  /** 6-row grid: leading blanks + one cell per day. */
  days: DayCell[];
  /** Per-date punch/status detail, keyed by `YYYY-MM-DD` — what a tapped day shows. */
  details: Record<string, DayDetail>;
  weeks: WeekHours[];
  summary: MySummary;
}

/** One staffer's month as the admin sheet shows it — days plus their roster. */
export interface MemberMonthReport {
  staffId: string;
  name: string;
  /** `YYYY-MM` of the displayed month. */
  monthISO: string;
  /** e.g. "August 2026". */
  monthLabel: string;
  schedule: WorkSchedule;
  /** Every day of the month, oldest first. */
  days: DayDetail[];
  tally: Record<AttendanceStatus, number>;
  /** Days marked Late with the 25% cut applied. */
  cuts: number;
  /** Real clocked hours across the month. */
  hoursWorked: number;
}
