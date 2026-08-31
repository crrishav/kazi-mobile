/**
 * Data-source selector for the attendance module.
 *   reads  → Firestore when configured (mock fallback on error)
 *   writes → Firestore when configured, mirrored into the mock (see `liveWrite`)
 *
 * `fetchClockStatus` is derived from today's `clock_ins` rows for the signed-in
 * user; `toggleClock` / `setMemberStatus` hit `clock_ins` / `attendance`.
 * Roll-call undo re-applies the prior status through `setMemberStatus`, so
 * `restoreTeam` stays mock-only (used only as a local snapshot restore).
 */

import { isFirebaseConfigured } from '@/lib/firebase';
import { withMockFallback } from '@/lib/firestore/read';
import { liveWrite } from '@/lib/firestore/write';

import * as live from './firestore';
import * as liveMonth from './firestore-month';
import * as writeLive from './firestore-write';
import * as mock from './mock-api';
import type { AttendanceStatus } from './types';

export { restoreTeam, statusLabel } from './mock-api';
export type { ClockToggleInput } from './mock-api';

export const fetchTeam = isFirebaseConfigured
  ? withMockFallback('attendance/team', live.fetchTeam, mock.fetchTeam)
  : mock.fetchTeam;

export const fetchClockPunches = isFirebaseConfigured
  ? withMockFallback('attendance/punches', live.fetchClockPunches, mock.fetchClockPunches)
  : mock.fetchClockPunches;

// No mock fallback: `writeLive.fetchClockStatus` already catches its own errors
// and returns a safe "not clocked in" state. Falling back to the mock here would
// surface its seeded "clocked in since 08:12" demo value to a real user.
export const fetchClockStatus = isFirebaseConfigured
  ? writeLive.fetchClockStatus
  : mock.fetchClockStatus;

// Same reasoning as `fetchClockStatus`: no mock fallback. `liveMonth.fetchMyMonth`
// catches its own read failures and returns an honest empty month — falling back
// would show a real user the seeded "168h 40m / NPR 1,250 deduction" persona.
export const fetchMyMonth = isFirebaseConfigured ? liveMonth.fetchMyMonth : mock.fetchMyMonth;

export const toggleClock = liveWrite('attendance/toggleClock', writeLive.toggleClock, mock.toggleClock);

export const setMemberStatus = liveWrite(
  'attendance/setMemberStatus',
  (id: number, status: AttendanceStatus, name?: string) => writeLive.setMemberStatus(id, status, name),
  (id: number, status: AttendanceStatus, _name?: string) => mock.setMemberStatus(id, status),
);
