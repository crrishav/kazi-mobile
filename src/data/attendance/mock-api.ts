import { simulateLatency } from '../mock/delay';
import { evaluateGeofence } from '@/lib/geo';
import { CLOCK_PUNCHES, DEFAULT_CLOCK_STATUS, STATUS_LABELS, TEAM } from './mock';
import { calculateAttendanceStatus } from './schedule';
import type { AttendanceStatus, ClockPunch, ClockStatus, PunchSummary, TeamMember } from './types';

let clock: ClockStatus = { ...DEFAULT_CLOCK_STATUS };
let teamDb: TeamMember[] = TEAM.map((m) => ({ ...m }));
let punchesDb: ClockPunch[] = CLOCK_PUNCHES.map((p) => ({ ...p }));

function nowLabel(d = new Date()): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function isoDate(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export async function fetchClockStatus(): Promise<ClockStatus> {
  await simulateLatency();
  return { ...clock };
}

/** GPS clock-in/out payload — coords present on a real fix, null on bypass or clock-out. */
export interface ClockToggleInput {
  elapsedSeconds: number;
  staffName: string;
  coords: { lat: number; lng: number; accuracyM: number } | null;
  /** The user proceeded past a failed geofence / accuracy / permission gate. */
  bypassUsed: boolean;
}

export async function toggleClock(input: ClockToggleInput): Promise<ClockStatus> {
  await simulateLatency(250);
  const now = new Date();

  if (clock.clockedIn) {
    // Clock out — close the open punch, keep the session's punch summary for display.
    const open = [...punchesDb].reverse().find((p) => p.staffName === input.staffName && p.clockedOutAt === null);
    if (open) open.clockedOutAt = now.toISOString();
    punchesDb = [...punchesDb];
    clock = {
      clockedIn: false,
      inTime: clock.inTime,
      outTime: nowLabel(now),
      elapsedSeconds: input.elapsedSeconds,
      lastPunch: clock.lastPunch,
    };
    return { ...clock };
  }

  // Clock in — grade against the shift, geofence the fix, record a clock_ins row.
  const late = calculateAttendanceStatus(input.staffName, now);
  const geo = input.coords
    ? evaluateGeofence(input.coords.lat, input.coords.lng, input.coords.accuracyM)
    : null;

  const summary: PunchSummary = {
    distanceToSiteM: geo ? geo.distanceM : null,
    accuracyM: geo ? geo.accuracyM : null,
    bypassUsed: input.bypassUsed,
    status: late.status,
    lateMinutes: late.lateMinutes,
    lateCutApplied: late.lateCutApplied,
  };

  punchesDb = [
    ...punchesDb,
    {
      id: `ci-${now.getTime()}`,
      staffName: input.staffName,
      date: isoDate(now),
      clockedInAt: now.toISOString(),
      clockedOutAt: null,
      lat: input.coords?.lat ?? null,
      lng: input.coords?.lng ?? null,
      ...summary,
    },
  ];

  clock = {
    clockedIn: true,
    inTime: nowLabel(now),
    outTime: null,
    elapsedSeconds: input.elapsedSeconds,
    lastPunch: summary,
  };
  return { ...clock };
}

export async function fetchClockPunches(): Promise<ClockPunch[]> {
  await simulateLatency();
  return [...punchesDb].sort((a, b) => b.clockedInAt.localeCompare(a.clockedInAt)).map((p) => ({ ...p }));
}

export async function fetchTeam(): Promise<TeamMember[]> {
  await simulateLatency();
  return teamDb.map((m) => ({ ...m }));
}

/** Admin roll-call edit (item 27) — set a staffer's status for the day; `times`/`hours` follow the status. */
export async function setMemberStatus(id: number, status: AttendanceStatus): Promise<void> {
  await simulateLatency(180);
  teamDb = teamDb.map((m) => {
    if (m.id !== id) return m;
    const times =
      status === 'absent' ? '— → —' : status === 'leave' ? 'Approved leave' : status === 'half' ? '08:10 → 12:30' : m.times.includes('→') && m.times !== '— → —' ? m.times : '08:00 → —';
    const hours = status === 'absent' || status === 'leave' ? '0h 00m' : status === 'half' ? '4h 20m' : m.hours === '0h 00m' ? '6h 30m' : m.hours;
    return { ...m, status, times, hours };
  });
}

export async function restoreTeam(previous: TeamMember[]): Promise<void> {
  await simulateLatency(120);
  teamDb = previous.map((m) => ({ ...m }));
}

/** Human-readable status label — re-exported for CSV builders. */
export const statusLabel = (s: AttendanceStatus) => STATUS_LABELS[s];
