/**
 * Shared live-attendance primitives — the pieces both the "my month" reader
 * (`firestore-month.ts`) and the admin member sheet (`firestore-admin.ts`) need:
 * Kathmandu date maths, work schedules off the `employees` doc, and the per-day
 * merge of an `attendance` row with its `clock_ins` punch.
 *
 * The rules here mirror the reference web app (`src/constants.js`,
 * `src/pages/Attendance.jsx`, `src/pages/Employees.jsx`) so a figure shown in
 * the app matches the same figure on the site:
 *   - a shift comes from `scheduleStart` / `scheduleEnd`, narrowed by
 *     `scheduleWorkingDays` and then by `scheduleDayOverrides[weekday]`
 *   - 15+ minutes past shift start → Late **with** a 25% salary cut for the day;
 *     1–14 minutes → Late on grace, no cut
 *   - the cut is `basicSalaryNPR / 30 × 0.25` per cut day
 *
 * Every reader here swallows its own errors and degrades to an empty result, so
 * one denied collection can't blank a whole screen.
 */

import { collection, getDocs, query, where, type QueryConstraint } from '@/lib/supabase/firestore-compat';

import { getDb } from '@/lib/supabase/firestore-compat';
import { arr, num, str, tsToISO } from '@/lib/firestore/normalise';

import type { AttendanceStatus, DayDetail, WorkSchedule } from './types';

export const ATTENDANCE = 'attendance';
export const CLOCK_INS = 'clock_ins';
export const EMPLOYEES = 'employees';

/** Nepal is a fixed UTC+5:45 with no DST — safe to offset by a constant. */
const NEPAL_OFFSET_MS = (5 * 60 + 45) * 60_000;

export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** Reference rule: 15+ minutes past shift start forfeits 25% of the day's salary. */
export const LATE_GRACE_MIN = 15;
export const LATE_CUT_FRACTION = 0.25;
/** The reference payroll divides the basic salary by a flat 30 to get a day rate. */
export const PAYROLL_DAYS_PER_MONTH = 30;

export const DEFAULT_WORKING_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

export const DEFAULT_SCHEDULE: WorkSchedule = {
  start: '09:00',
  end: '17:00',
  workingDays: DEFAULT_WORKING_DAYS,
  dayOverrides: {},
};

// ---------------------------------------------------------------------------
// Kathmandu date maths. Every ISO date is parsed as UTC midnight so the device's
// own timezone can never shift a weekday or a month boundary.

/** `YYYY-MM-DD` for an instant, in Asia/Kathmandu — the date the web writes. */
export function nepalToday(): string {
  return new Date(Date.now() + NEPAL_OFFSET_MS).toISOString().slice(0, 10);
}

export function isoFor(year: number, month1: number, day: number): string {
  return `${year}-${String(month1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function daysInMonth(year: number, month1: number): number {
  return new Date(Date.UTC(year, month1, 0)).getUTCDate();
}

/** Weekday index (0 = Sun) of an ISO date. */
export function weekdayOf(iso: string): number {
  return new Date(`${iso}T00:00:00Z`).getUTCDay();
}

export function dayNameOf(iso: string): string {
  return DAY_NAMES[weekdayOf(iso)];
}

/** `2026-08-31` → `Sun 31 Aug`. */
export function dayLabelOf(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return `${DAY_NAMES[d.getUTCDay()]} ${d.getUTCDate()} ${MONTH_NAMES[d.getUTCMonth()].slice(0, 3)}`;
}

/** `2026-08` → `August 2026`. */
export function monthLabelOf(monthISO: string): string {
  const year = Number(monthISO.slice(0, 4));
  const month1 = Number(monthISO.slice(5, 7));
  return `${MONTH_NAMES[month1 - 1]} ${year}`;
}

/** Step a `YYYY-MM` month string by `delta` months. */
export function shiftMonth(monthISO: string, delta: number): string {
  const year = Number(monthISO.slice(0, 4));
  const month0 = Number(monthISO.slice(5, 7)) - 1 + delta;
  const d = new Date(Date.UTC(year, month0, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** Step a `YYYY-MM-DD` date string by `delta` days. */
export function shiftDate(iso: string, delta: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

/** `HH:MM` of an ISO instant, in Asia/Kathmandu. */
export function hhmm(iso: string): string | null {
  const ms = new Date(iso).getTime();
  if (Number.isNaN(ms)) return null;
  return new Date(ms + NEPAL_OFFSET_MS).toISOString().slice(11, 16);
}

export function minutesOf(time: string): number {
  const [h, m] = time.split(':').map((n) => parseInt(n, 10));
  if (!Number.isFinite(h)) return 0;
  return h * 60 + (Number.isFinite(m) ? m : 0);
}

// ---------------------------------------------------------------------------
// Schedules

/**
 * The shift rostered for one weekday, or null when it's a weekly off — the
 * reference's `getEmployeeScheduleForDate`, minus the runtime-override registry.
 */
export function shiftForDay(schedule: WorkSchedule, dayName: string): { start: string; end: string } | null {
  if (!schedule.workingDays.includes(dayName)) return null;
  const o = schedule.dayOverrides[dayName];
  if (o && (o.start || o.end)) return { start: o.start || schedule.start, end: o.end || schedule.end };
  return { start: schedule.start, end: schedule.end };
}

/** Rostered hours for one weekday, 0 on a weekly off. */
export function scheduledHoursFor(schedule: WorkSchedule, dayName: string): number {
  const shift = shiftForDay(schedule, dayName);
  if (!shift) return 0;
  const mins = minutesOf(shift.end) - minutesOf(shift.start);
  return mins > 0 ? mins / 60 : 8;
}

/** One staffer's directory entry, as far as attendance cares. */
export interface EmployeeRecord {
  docId: string;
  name: string;
  email: string;
  role: string;
  /**
   * The doc's own `id` field. Despite the name this is the `employees` doc id,
   * not the Auth UID the attendance collections key on — see `findEmployee`.
   */
  staffId: string;
  basicSalaryNPR: number;
  schedule: WorkSchedule;
}

function toSchedule(x: Record<string, unknown>): WorkSchedule {
  const days = arr<unknown>(x.scheduleWorkingDays)
    .map((d) => str(d).trim().slice(0, 3))
    .filter(Boolean);
  const raw = (x.scheduleDayOverrides ?? {}) as Record<string, unknown>;
  const dayOverrides: WorkSchedule['dayOverrides'] = {};
  for (const [k, v] of Object.entries(raw)) {
    if (v && typeof v === 'object') {
      const o = v as Record<string, unknown>;
      const start = str(o.start).trim();
      const end = str(o.end).trim();
      if (start || end) dayOverrides[k.slice(0, 3)] = { start: start || undefined, end: end || undefined };
    }
  }
  return {
    start: str(x.scheduleStart).trim() || DEFAULT_SCHEDULE.start,
    end: str(x.scheduleEnd).trim() || DEFAULT_SCHEDULE.end,
    workingDays: days.length ? days : DEFAULT_WORKING_DAYS,
    dayOverrides,
  };
}

/** Every `employees` doc, normalised. Empty on a denied read. */
export async function readEmployees(): Promise<EmployeeRecord[]> {
  try {
    const snap = await getDocs(collection(getDb(), EMPLOYEES));
    return snap.docs.map((d) => {
      const x = d.data() as Record<string, unknown>;
      return {
        docId: d.id,
        name: str(x.name).trim(),
        email: str(x.email).trim(),
        role: str(x.role).trim(),
        staffId: str(x.id).trim(),
        basicSalaryNPR: num(x.basicSalaryNPR),
        schedule: toSchedule(x),
      };
    });
  } catch (err) {
    console.warn('[attendance] employees read failed — falling back to the default shift', err);
    return [];
  }
}

/**
 * Pick one staffer out of the directory.
 *
 * The join is awkward in the live data: `employees.id` holds the doc's own id,
 * **not** the Auth UID that `attendance.staffId` / `clock_ins.staffId` use, so
 * there's no shared key. Email is the only exact join, and it's only available
 * for the signed-in user. Otherwise we fall back to the name, allowing a
 * first-name record to find its full-name directory entry ("Anmol" →
 * "Anmol Basnet") on a word boundary — never a bare substring, which would let
 * "Sam" claim "Samir".
 */
export function findEmployee(
  employees: EmployeeRecord[],
  { uid, email, name }: { uid?: string | null; email?: string; name?: string },
): EmployeeRecord | null {
  const wantEmail = (email ?? '').trim().toLowerCase();
  const wantName = (name ?? '').trim().toLowerCase();
  const nameOf = (e: EmployeeRecord) => e.name.trim().toLowerCase();
  const prefixes = (a: string, b: string) => a.startsWith(`${b} `);
  return (
    employees.find((e) => !!uid && (e.staffId === uid || e.docId === uid)) ??
    employees.find((e) => !!wantEmail && e.email.trim().toLowerCase() === wantEmail) ??
    employees.find((e) => !!wantName && nameOf(e) === wantName) ??
    employees.find((e) => !!wantName && (prefixes(nameOf(e), wantName) || prefixes(wantName, nameOf(e)))) ??
    null
  );
}

// ---------------------------------------------------------------------------
// Row readers. Queries are single-field equality only, so no composite index is
// ever required; the month window is applied in memory.

export function mapStatus(raw: unknown): AttendanceStatus {
  const s = str(raw).trim().toLowerCase();
  if (s.startsWith('late')) return 'late';
  if (s.startsWith('absent')) return 'absent';
  if (s.startsWith('half')) return 'half';
  if (s.startsWith('leave')) return 'leave';
  return 'present';
}

/** Mobile status → the exact label the web writes to `attendance.status`. */
export const STATUS_TO_LIVE: Record<AttendanceStatus, string> = {
  present: 'Present',
  late: 'Late',
  absent: 'Absent',
  half: 'Half-day',
  leave: 'Leave',
};

export interface AttRow {
  status: AttendanceStatus;
  hours: number;
  note: string;
  lateMinutes: number;
  lateCutApplied: boolean;
  role: string;
  staffName: string;
  /** Used only to break a tie when two identities hold the same day. */
  createdAt: string;
}

export interface PunchRow {
  id: string;
  clockedInAt: string;
  clockedOutAt: string | null;
  distanceToSiteM: number | null;
}

function boolish(v: unknown): boolean {
  return v === true || /^true$/i.test(str(v));
}

/**
 * One person's identity in the attendance collections. The live data has people
 * filed under more than one `staffId` (an Auth UID from the app, plus an
 * email-derived id from an older import), so a read takes every id they own and
 * also sweeps their display name — otherwise half a month goes missing.
 */
export interface StaffIdentity {
  /** Every `staffId` this person's rows are filed under. */
  ids: string[];
  /** Display name as it appears in `staffName`. */
  name: string;
}

/** Equality-only filters covering an identity: `staffId in [...]` plus the name. */
function identityFilters({ ids, name }: StaffIdentity): QueryConstraint[][] {
  const filters: QueryConstraint[][] = [];
  const unique = [...new Set(ids.filter(Boolean))];
  // Firestore caps `in` at 30 values; nobody has more than a couple of ids.
  if (unique.length === 1) filters.push([where('staffId', '==', unique[0])]);
  else if (unique.length > 1) filters.push([where('staffId', 'in', unique.slice(0, 30))]);
  if (name) filters.push([where('staffName', '==', name)]);
  return filters;
}

/** `attendance` rows for one person in one `YYYY-MM`, keyed by date. */
export async function readAttendanceMonth(identity: StaffIdentity, monthISO: string): Promise<Map<string, AttRow>> {
  const out = new Map<string, AttRow>();
  for (const constraints of identityFilters(identity)) {
    try {
      const snap = await getDocs(query(collection(getDb(), ATTENDANCE), ...constraints));
      for (const d of snap.docs) {
        const x = d.data() as Record<string, unknown>;
        const date = str(x.date).trim() || tsToISO(x.createdAt).slice(0, 10);
        if (!date.startsWith(monthISO)) continue;
        const row: AttRow = {
          status: mapStatus(x.status),
          hours: num(x.hours),
          note: str(x.note).trim(),
          lateMinutes: num(x.lateMinutes),
          lateCutApplied: boolish(x.lateCutApplied),
          role: str(x.role).trim(),
          staffName: str(x.staffName).trim(),
          createdAt: tsToISO(x.createdAt),
        };
        // Two identities can both hold a row for the same day — the newer wins.
        const prev = out.get(date);
        if (!prev || row.createdAt > prev.createdAt) out.set(date, row);
      }
    } catch (err) {
      console.warn('[attendance] attendance month read failed', err);
    }
  }
  return out;
}

/** `clock_ins` punches for one person in one `YYYY-MM`, keyed by date. */
export async function readPunchMonth(identity: StaffIdentity, monthISO: string): Promise<Map<string, PunchRow>> {
  const out = new Map<string, PunchRow>();
  for (const constraints of identityFilters(identity)) {
    try {
      const snap = await getDocs(query(collection(getDb(), CLOCK_INS), ...constraints));
      for (const d of snap.docs) {
        const x = d.data() as Record<string, unknown>;
        const clockedInAt = tsToISO(x.clockedInAt ?? x.createdAt);
        const date = str(x.date).trim() || clockedInAt.slice(0, 10);
        if (!date.startsWith(monthISO)) continue;
        const row: PunchRow = {
          id: d.id,
          clockedInAt,
          clockedOutAt: x.clockedOutAt ? tsToISO(x.clockedOutAt) : null,
          distanceToSiteM: x.distanceToSiteM == null ? null : num(x.distanceToSiteM),
        };
        // One punch per person per day, but keep the newest if a duplicate exists.
        const prev = out.get(date);
        if (!prev || row.clockedInAt > prev.clockedInAt) out.set(date, row);
      }
    } catch (err) {
      console.warn('[attendance] clock_ins month read failed', err);
    }
  }
  return out;
}

/**
 * Real clocked duration in hours — measured from the punch timestamps, not from
 * the stored `workedHours`, so the figure is always the actual time between
 * clock-in and clock-out. Null while a punch is still open.
 */
export function punchDuration(punch: PunchRow | undefined): number | null {
  if (!punch?.clockedOutAt) return null;
  const inMs = new Date(punch.clockedInAt).getTime();
  const outMs = new Date(punch.clockedOutAt).getTime();
  if (!Number.isFinite(inMs) || !Number.isFinite(outMs) || outMs <= inMs) return null;
  return Math.round(((outMs - inMs) / 3_600_000) * 100) / 100;
}

/** Merge one date's `attendance` row and `clock_ins` punch into a display shape. */
export function buildDayDetail(
  date: string,
  schedule: WorkSchedule,
  att: AttRow | undefined,
  punch: PunchRow | undefined,
): DayDetail {
  const dayName = dayNameOf(date);
  const shift = shiftForDay(schedule, dayName);
  const worked = punchDuration(punch);
  return {
    date,
    label: dayLabelOf(date),
    status: att?.status ?? null,
    clockIn: punch ? hhmm(punch.clockedInAt) : null,
    clockOut: punch?.clockedOutAt ? hhmm(punch.clockedOutAt) : null,
    workedHours: worked,
    scheduledHours: scheduledHoursFor(schedule, dayName),
    shiftLabel: shift ? `${shift.start}–${shift.end}` : null,
    lateMinutes: att?.lateMinutes ?? 0,
    lateCutApplied: att?.lateCutApplied ?? false,
    note: att?.note ?? '',
    distanceToSiteM: punch?.distanceToSiteM ?? null,
    isWeeklyOff: shift === null,
  };
}

/**
 * The reference payroll's late deduction: a flat 25% of one day's salary per
 * cut day, where a day is the basic salary over 30.
 */
export function lateCutAmountNPR(basicSalaryNPR: number, cutDays: number): number {
  if (!basicSalaryNPR || !cutDays) return 0;
  return Math.round((basicSalaryNPR / PAYROLL_DAYS_PER_MONTH) * LATE_CUT_FRACTION * cutDays);
}

/** `7.25` → `"7h 15m"`. */
export function formatHours(totalHours: number): string {
  const safe = Math.max(0, totalHours);
  const h = Math.floor(safe);
  const m = Math.round((safe - h) * 60);
  // 7.999h → "8h 00m", not "7h 60m".
  return m === 60 ? `${h + 1}h 00m` : `${h}h ${String(m).padStart(2, '0')}m`;
}
