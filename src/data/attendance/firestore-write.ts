/**
 * Live attendance writers — match the reference web app's ClockInCard /
 * Attendance page contract exactly so a mobile punch behaves identically to a
 * web one:
 *
 *   clock IN  → addDoc `clock_ins` { staffId, staffName, role, date, lat, lng,
 *               accuracyM, distanceToSiteM, clockedInAt: serverTimestamp(),
 *               [bypassUsed] }
 *            → setDoc `attendance/{date}_{uid}` (merge) { date, staffId, staffName,
 *               role, status, hours: 8, note, loggedBy, createdAt, lateCutApplied,
 *               lateMinutes }
 *   clock OUT → merge `clock_ins/{id}` { clockedOutAt: serverTimestamp(), workedHours }
 *            → merge `attendance/{date}_{uid}` { note: "GPS clock-in & out", hours }
 *
 * `fetchClockStatus` mirrors the web read: `clock_ins` where staffId == uid and
 * date == today, then open (no clockedOutAt) vs closed.
 *
 * Security rules: `clock_ins.create` needs `staffId == request.auth.uid`;
 * `attendance` self-writes need the `{date}_{uid}` id + matching `staffId`.
 * Roll-call editing is admin-gated in the UI (permission path in the rules).
 */

import { collection, getDocs, query, serverTimestamp, where } from 'firebase/firestore';

import { evaluateGeofence } from '@/lib/geo';
import { getDb } from '@/lib/firebase';
import { str, tsToISO } from '@/lib/firestore/normalise';
import { createDocument, patchDocument, setDocument } from '@/lib/firestore/write';
import { getActor } from '@/data/notifications/actor';

import { DEFAULT_CLOCK_STATUS } from './mock';
import { calculateAttendanceStatus } from './schedule';
import type { AttendanceStatus, ClockStatus, PunchSummary } from './types';
import type { ClockToggleInput } from './mock-api';

const CLOCK_INS = 'clock_ins';
const ATTENDANCE = 'attendance';

function isoDate(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function hhmm(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function actorName(fallback = ''): string {
  return getActor()?.name?.trim() || fallback;
}
function actorUid(): string | null {
  return getActor()?.uid ?? null;
}
function actorRole(): string {
  return getActor()?.role ?? '';
}

interface PunchRow {
  id: string;
  clockedInAt: string;
  clockedOutAt: string | null;
}

/** Today's `clock_ins` rows for the signed-in user (staffId == uid, date == today), newest first. */
async function todaysPunches(uid: string): Promise<PunchRow[]> {
  const snap = await getDocs(
    query(collection(getDb(), CLOCK_INS), where('staffId', '==', uid), where('date', '==', isoDate())),
  );
  return snap.docs
    .map((d) => {
      const data = d.data() as Record<string, unknown>;
      return {
        id: d.id,
        clockedInAt: tsToISO(data.clockedInAt ?? data.createdAt),
        clockedOutAt: data.clockedOutAt ? tsToISO(data.clockedOutAt) : null,
      };
    })
    .sort((a, b) => b.clockedInAt.localeCompare(a.clockedInAt));
}

function summaryFrom(late: { status: 'Present' | 'Late'; lateMinutes: number; lateCutApplied: boolean }): PunchSummary {
  return {
    distanceToSiteM: null,
    accuracyM: null,
    bypassUsed: false,
    status: late.status,
    lateMinutes: late.lateMinutes,
    lateCutApplied: late.lateCutApplied,
  };
}

/** Derive the current clock session from today's `clock_ins` rows. */
export async function fetchClockStatus(): Promise<ClockStatus> {
  const uid = actorUid();
  if (!uid) return { ...DEFAULT_CLOCK_STATUS };

  const punches = await todaysPunches(uid);
  if (punches.length === 0) {
    return { clockedIn: false, inTime: '--:--', outTime: null, elapsedSeconds: 0 };
  }

  const open = punches.find((p) => !p.clockedOutAt);
  const late = calculateAttendanceStatus(actorName(), new Date(open?.clockedInAt ?? punches[0].clockedInAt));

  if (open) {
    const startMs = new Date(open.clockedInAt).getTime();
    const elapsed = Number.isNaN(startMs) ? 0 : Math.max(0, Math.floor((Date.now() - startMs) / 1000));
    return { clockedIn: true, inTime: hhmm(open.clockedInAt), outTime: null, elapsedSeconds: elapsed, lastPunch: summaryFrom(late) };
  }

  const last = punches[0];
  const inMs = new Date(last.clockedInAt).getTime();
  const outMs = new Date(last.clockedOutAt as string).getTime();
  const worked = Number.isNaN(inMs) || Number.isNaN(outMs) ? 0 : Math.max(0, Math.floor((outMs - inMs) / 1000));
  return {
    clockedIn: false,
    inTime: hhmm(last.clockedInAt),
    outTime: hhmm(last.clockedOutAt as string),
    elapsedSeconds: worked,
    lastPunch: summaryFrom(late),
  };
}

/** Clock in (new `clock_ins` + companion `attendance` doc) or clock out (merge both). */
export async function toggleClock(input: ClockToggleInput): Promise<void> {
  const uid = actorUid();
  if (!uid) throw new Error('toggleClock: no Firebase Auth UID — clock_ins.staffId is required by the security rules');
  const name = actorName(input.staffName);
  const role = actorRole();
  const now = new Date();
  const today = isoDate(now);
  const attId = `${today}_${uid}`;

  const punches = await todaysPunches(uid);
  const open = punches.find((p) => !p.clockedOutAt);

  if (open) {
    const inMs = new Date(open.clockedInAt).getTime();
    const workedHours = Number.isNaN(inMs) ? undefined : Math.max(0, Math.round(((now.getTime() - inMs) / 3_600_000) * 10) / 10);
    await patchDocument(CLOCK_INS, open.id, { clockedOutAt: serverTimestamp(), workedHours });
    await setDocument(ATTENDANCE, attId, { note: 'GPS clock-in & out', hours: workedHours }, { merge: true });
    return;
  }

  const late = calculateAttendanceStatus(name, now);
  const geo = input.coords ? evaluateGeofence(input.coords.lat, input.coords.lng, input.coords.accuracyM) : null;

  await createDocument(CLOCK_INS, {
    staffId: uid,
    staffName: name,
    role,
    date: today,
    lat: input.coords?.lat ?? null,
    lng: input.coords?.lng ?? null,
    accuracyM: geo ? geo.accuracyM : null,
    distanceToSiteM: geo ? geo.distanceM : null,
    clockedInAt: serverTimestamp(),
    ...(input.bypassUsed ? { bypassUsed: true } : {}),
  });

  await setDocument(
    ATTENDANCE,
    attId,
    {
      date: today,
      staffId: uid,
      staffName: name,
      role,
      status: late.status,
      hours: 8,
      note: input.bypassUsed ? 'GPS clock-in (low-accuracy bypass)' : 'GPS clock-in',
      loggedBy: 'GPS',
      createdAt: serverTimestamp(),
      lateCutApplied: late.lateCutApplied,
      lateMinutes: late.lateMinutes,
    },
    { merge: true },
  );
}

const STATUS_TO_LIVE: Record<AttendanceStatus, string> = {
  present: 'Present',
  late: 'Late',
  absent: 'Absent',
  half: 'Half Day',
  leave: 'Leave',
};

const STATUS_TO_HOURS: Record<AttendanceStatus, number> = { present: 8, late: 8, half: 4, absent: 0, leave: 0 };

/** Recover an employee's `staffId` (Auth UID) from any of their `attendance` rows. */
async function staffIdForName(name: string): Promise<{ staffId: string | null; role: string; latestDocId: string | null; latestDate: string }> {
  const snap = await getDocs(query(collection(getDb(), ATTENDANCE), where('staffName', '==', name)));
  let staffId: string | null = null;
  let role = '';
  let latestDocId: string | null = null;
  let latestDate = '';
  snap.docs.forEach((d) => {
    const data = d.data() as Record<string, unknown>;
    const date = str(data.date).trim() || tsToISO(data.createdAt).slice(0, 10);
    if (!staffId && str(data.staffId).trim()) staffId = str(data.staffId).trim();
    if (date >= latestDate) {
      latestDate = date;
      latestDocId = d.id;
      if (str(data.role).trim()) role = str(data.role).trim();
    }
  });
  return { staffId, role, latestDocId, latestDate };
}

/**
 * Roll-call edit — set a staffer's status for today in `attendance`, matching the
 * reference page's `{date}_{staffId}` doc keying. `name` is the display name (the
 * mobile numeric `id` doesn't map to a live doc).
 */
export async function setMemberStatus(_id: number, status: AttendanceStatus, name?: string): Promise<void> {
  const staffName = (name ?? '').trim();
  if (!staffName) throw new Error('setMemberStatus: staff name required for the live write');

  const today = isoDate();
  const { staffId, role, latestDocId, latestDate } = await staffIdForName(staffName);
  const fields = {
    date: today,
    staffName,
    role,
    status: STATUS_TO_LIVE[status],
    hours: STATUS_TO_HOURS[status],
    loggedBy: getActor()?.name ?? 'kazi-mobile',
    createdAt: serverTimestamp(),
    lateCutApplied: false,
    lateMinutes: 0,
  };

  if (staffId) {
    await setDocument(ATTENDANCE, `${today}_${staffId}`, { ...fields, staffId }, { merge: true });
  } else if (latestDocId && latestDate === today) {
    // No recoverable uid, but today's row exists — patch it in place.
    await patchDocument(ATTENDANCE, latestDocId, {
      status: fields.status,
      hours: fields.hours,
      loggedBy: fields.loggedBy,
    });
  } else {
    await createDocument(ATTENDANCE, { ...fields, note: '' });
  }
}
