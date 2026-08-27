import type { AttendanceStatus, ClockPunch, ClockStatus, MySummary, RollCallTotals, TeamMember, TeamMonthStats } from './types';

export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const MONTH_LABEL = 'August 2026';
/** AD ISO span of the displayed month — feeds the calendar's BS sub-label (§2.4). */
export const MONTH_ISO_START = '2026-08-01';
export const MONTH_ISO_END = '2026-08-31';
export const WORKING_DAYS = 22;
export const TODAY_DAY = 26;
export const TARGET_SECONDS = 8 * 3600;

/** Hours logged per calendar week this month, against a 48h (6×8h) target — the "Mine" weekly bar chart (§3.12). */
export const WEEKLY_HOURS: { label: string; hours: number; target: number }[] = [
  { label: 'Aug 1–2', hours: 15, target: 16 },
  { label: 'Aug 3–9', hours: 46, target: 48 },
  { label: 'Aug 10–16', hours: 38, target: 48 },
  { label: 'Aug 17–23', hours: 49, target: 48 },
  { label: 'Aug 24–26', hours: 20, target: 24 },
];

export const STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: 'Present',
  late: 'Late',
  absent: 'Absent',
  half: 'Half-day',
  leave: 'Leave',
};

/** Per-status dot/chip/cell tones — not centralized in the shared theme, same reasoning as Production's own stage ramp: a fixed 5-state enum with no equivalent shared semantic role for "half-day". */
export const STATUS_RAMP: Record<'light' | 'dark', Record<AttendanceStatus, { dot: string; chipBg: string; chipFg: string; cellBg: string; cellFg: string }>> = {
  light: {
    present: { dot: '#22A97A', chipBg: '#E2F6EC', chipFg: '#0E5E43', cellBg: '#CDEDDD', cellFg: '#0E5E43' },
    late: { dot: '#B98514', chipBg: '#F7EEDA', chipFg: '#7A5709', cellBg: '#F7EEDA', cellFg: '#7A5709' },
    absent: { dot: '#C0603C', chipBg: '#F8E7DF', chipFg: '#8E4327', cellBg: '#F8E7DF', cellFg: '#8E4327' },
    half: { dot: '#2FA97C', chipBg: '#D6F0E3', chipFg: '#0E5E43', cellBg: '#A5E0C4', cellFg: '#0B4A35' },
    leave: { dot: '#8A9A92', chipBg: '#EDEFEC', chipFg: '#4A5A53', cellBg: '#EDEFEC', cellFg: '#4A5A53' },
  },
  dark: {
    present: { dot: '#6FDDA9', chipBg: 'rgba(111,221,169,0.16)', chipFg: '#6FDDA9', cellBg: 'rgba(111,221,169,0.16)', cellFg: '#6FDDA9' },
    late: { dot: '#DBB55C', chipBg: 'rgba(185,133,20,0.18)', chipFg: '#DBB55C', cellBg: 'rgba(185,133,20,0.18)', cellFg: '#DBB55C' },
    absent: { dot: '#E8A183', chipBg: 'rgba(224,138,99,0.18)', chipFg: '#E8A183', cellBg: 'rgba(224,138,99,0.18)', cellFg: '#E8A183' },
    half: { dot: '#3FE0A8', chipBg: 'rgba(63,224,168,0.22)', chipFg: '#6FDDA9', cellBg: 'rgba(63,224,168,0.22)', cellFg: '#6FDDA9' },
    leave: { dot: '#7E958A', chipBg: 'rgba(126,149,138,0.18)', chipFg: '#9DB2A7', cellBg: 'rgba(126,149,138,0.18)', cellFg: '#9DB2A7' },
  },
};

/** day-of-month → exception status; every other working day defaults to present. */
export const EXCEPTIONS: Record<number, AttendanceStatus> = { 5: 'late', 11: 'absent', 14: 'half', 18: 'late', 20: 'leave', 24: 'late' };

export const MY_SUMMARY: MySummary = {
  hoursWorked: '168h 40m',
  overtime: '12h 15m',
  lateMarks: 3,
  lateAllowed: 4,
  absentDays: 1,
  leaveTaken: 1,
  leaveAllowed: 12,
  deduction: 1250,
  deductionNote: '1 absent day · 3 late marks',
};

export const DEFAULT_CLOCK_STATUS: ClockStatus = { clockedIn: true, inTime: '08:12', outTime: null, elapsedSeconds: 6 * 3600 + 42 * 60 };

export const TODAY_LABEL = 'Tue 26 Aug';

export const TEAM: TeamMember[] = [
  { id: 1, name: 'Anil Karki', role: 'Cutting', initials: 'AK', avatarTint: 'mint', status: 'present', times: '08:04 → —', hours: '6h 50m', month: { present: 22, late: 1, absent: 0, half: 1, leave: 0, otHours: '9h 20m', hoursMTD: '176h 10m' } },
  { id: 2, name: 'Pramila Thapa', role: 'Sewing', initials: 'PT', avatarTint: 'clay', status: 'late', times: '09:22 → —', hours: '5h 32m', month: { present: 18, late: 4, absent: 1, half: 1, leave: 0, otHours: '3h 05m', hoursMTD: '162h 40m' } },
  { id: 3, name: 'Rabin Bhandari', role: 'Finishing', initials: 'RB', avatarTint: 'draft', status: 'present', times: '07:58 → —', hours: '6h 56m', month: { present: 23, late: 0, absent: 0, half: 0, leave: 1, otHours: '11h 45m', hoursMTD: '181h 05m' } },
  { id: 4, name: 'Manisha Gurung', role: 'Packing', initials: 'MG', avatarTint: 'amber', status: 'half', times: '08:10 → 12:30', hours: '4h 20m', month: { present: 20, late: 2, absent: 0, half: 2, leave: 0, otHours: '1h 30m', hoursMTD: '156h 20m' } },
  { id: 5, name: 'Deepak Shrestha', role: 'QC', initials: 'DS', avatarTint: 'draft', status: 'absent', times: '— → —', hours: '0h 00m', month: { present: 19, late: 1, absent: 3, half: 0, leave: 1, otHours: '0h 00m', hoursMTD: '148h 00m' } },
  { id: 6, name: 'Sunita Rai', role: 'Sewing', initials: 'SR', avatarTint: 'mint', status: 'leave', times: 'Approved leave', hours: '0h 00m', month: { present: 17, late: 0, absent: 0, half: 0, leave: 6, otHours: '2h 10m', hoursMTD: '133h 15m' } },
  { id: 7, name: 'Bimal Katwal', role: 'Cutting', initials: 'BK', avatarTint: 'dark', status: 'present', times: '08:01 → —', hours: '6h 53m', month: { present: 24, late: 0, absent: 0, half: 0, leave: 0, otHours: '14h 00m', hoursMTD: '188h 30m' } },
];

/** The signed-in "Mine" view persona — schedule + late-cut key into `schedule.ts`. */
export const MY_NAME = 'Sita Rai';

/** Recent GPS punches for the "Mine" persona — reference `clock_ins` collection (item 26). */
export const CLOCK_PUNCHES: ClockPunch[] = [
  {
    id: 'ci-0825',
    staffName: MY_NAME,
    date: '2026-08-25',
    clockedInAt: '2026-08-25T09:04:00+05:45',
    clockedOutAt: '2026-08-25T17:36:00+05:45',
    lat: 27.68159,
    lng: 85.33702,
    accuracyM: 18,
    distanceToSiteM: 41,
    bypassUsed: false,
    status: 'Present',
    lateMinutes: 4,
    lateCutApplied: false,
  },
  {
    id: 'ci-0822',
    staffName: MY_NAME,
    date: '2026-08-22',
    clockedInAt: '2026-08-22T09:26:00+05:45',
    clockedOutAt: '2026-08-22T17:40:00+05:45',
    lat: 27.6817,
    lng: 85.33681,
    accuracyM: 24,
    distanceToSiteM: 33,
    bypassUsed: false,
    status: 'Late',
    lateMinutes: 26,
    lateCutApplied: true,
  },
];

export const ROLL_CALL: RollCallTotals = { onRoll: 241, present: 213, late: 9, absent: 13, half: 6, leave: 6 };

export const TEAM_MONTH_STATS: TeamMonthStats = { lineLabel: 'Month to date · Line 3', teamHours: '3,912h', attendanceCuts: 18400 };
