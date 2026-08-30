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

export const fetchClockStatus = isFirebaseConfigured
  ? withMockFallback('attendance/clock', writeLive.fetchClockStatus, mock.fetchClockStatus)
  : mock.fetchClockStatus;

export const toggleClock = liveWrite('attendance/toggleClock', writeLive.toggleClock, mock.toggleClock);

export const setMemberStatus = liveWrite(
  'attendance/setMemberStatus',
  (id: number, status: AttendanceStatus, name?: string) => writeLive.setMemberStatus(id, status, name),
  (id: number, status: AttendanceStatus, _name?: string) => mock.setMemberStatus(id, status),
);
