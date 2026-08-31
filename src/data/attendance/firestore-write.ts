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
 * One `clock_ins` doc per person per day (like the web): a second clock-in the
 * same day *reopens* the existing row rather than adding another, so a stale
 * "open" duplicate can't linger after a clock-out made elsewhere.
 *
 * `fetchClockStatus` reads the newest `clock_ins` row for today AND the
 * companion `attendance/{date}_{uid}` doc, and reports the punch summary
 * (status / late minutes / GPS distance) straight from those stored values —
 * the same figures the web shows — instead of recomputing. It only falls back
 * to a local late-calc when no `attendance` row exists yet. "Today" is
 * Asia/Kathmandu (fixed UTC+5:45), not the device timezone.
 *
 * Security rules: `clock_ins.create` needs `staffId == request.auth.uid`;
 * `attendance` self-writes need the `{date}_{uid}` id + matching `staffId`.
 * Roll-call editing is admin-gated in the UI (permission path in the rules).
 */

import { collection, doc, getDoc, getDocs, query, serverTimestamp, where } from 'firebase/firestore';

import { evaluateGeofence } from '@/lib/geo';
import { getDb } from '@/lib/firebase';
import { num, str, tsToISO } from '@/lib/firestore/normalise';
import { createDocument, patchDocument, setDocument } from '@/lib/firestore/write';
import { getActor } from '@/data/notifications/actor';

import { calculateAttendanceStatus } from './schedule';
import type { AttendanceStatus, ClockStatus, PunchSummary } from './types';
import type { ClockToggleInput } from './mock-api';

const CLOCK_INS = 'clock_ins';
const ATTENDANCE = 'attendance';

/** Safe "no active session" state — used when there's no punch today, no UID, or a read fails. */
const NOT_CLOCKED_IN: ClockStatus = { clockedIn: false, inTime: '--:--', outTime: null, elapsedSeconds: 0 };

/** Nepal is a fixed UTC+5:45 with no DST — safe to offset by a constant. */
const NEPAL_OFFSET_MS = (5 * 60 + 45) * 60_000;

/** `YYYY-MM-DD` for an instant, in Asia/Kathmandu — matches the date the web writes. */
function isoDate(at: number | Date = Date.now()): string {
  const ms = at instanceof Date ? at.getTime() : at;
  return new Date(ms + NEPAL_OFFSET_MS).toISOString().slice(0, 10);
}

/** `HH:MM` of an ISO instant, in Asia/Kathmandu. */
function hhmm(iso: string): string {
  const ms = new Date(iso).getTime();
  if (Number.isNaN(ms)) return '';
  return new Date(ms + NEPAL_OFFSET_MS).toISOString().slice(11, 16);
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
  distanceToSiteM: number | null;
  accuracyM: number | null;
  bypassUsed: boolean;
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
        distanceToSiteM: data.distanceToSiteM == null ? null : num(data.distanceToSiteM),
        accuracyM: data.accuracyM == null ? null : num(data.accuracyM),
        bypassUsed: data.bypassUsed === true || /^true$/i.test(str(data.bypassUsed)),
      };
    })
    .sort((a, b) => b.clockedInAt.localeCompare(a.clockedInAt));
}

interface StoredLate {
  status: 'Present' | 'Late';
  lateMinutes: number;
  lateCutApplied: boolean;
}

/**
 * The companion `attendance/{date}_{uid}` doc's stored late/status figures — the
 * ones the web shows. Returns null (→ local fallback calc) if the row is absent
 * or the read is denied; never throws.
 */
async function todaysAttendance(uid: string): Promise<StoredLate | null> {
  try {
    const snap = await getDoc(doc(getDb(), ATTENDANCE, `${isoDate()}_${uid}`));
    if (!snap.exists()) return null;
    const d = snap.data() as Record<string, unknown>;
    if (d.status == null && d.lateMinutes == null) return null;
    return {
      status: /late/i.test(str(d.status)) ? 'Late' : 'Present',
      lateMinutes: num(d.lateMinutes),
      lateCutApplied: d.lateCutApplied === true || /^true$/i.test(str(d.lateCutApplied)),
    };
  } catch (err) {
    console.warn('[attendance] attendance row read failed — using local late calc', err);
    return null;
  }
}

/** Punch summary from stored values: late/status from the `attendance` row, GPS from the `clock_ins` row. */
function buildSummary(stored: StoredLate | null, punch: PunchRow, fallbackName: string): PunchSummary {
  const late = stored ?? calculateAttendanceStatus(fallbackName, new Date(punch.clockedInAt));
  return {
    distanceToSiteM: punch.distanceToSiteM,
    accuracyM: punch.accuracyM,
    bypassUsed: punch.bypassUsed,
    status: late.status,
    lateMinutes: late.lateMinutes,
    lateCutApplied: late.lateCutApplied,
  };
}

/**
 * Current clock session: the newest `clock_ins` row for today decides
 * open/closed (an older orphan doesn't override a newer clock-out), and the
 * punch summary comes from the stored `attendance` + `clock_ins` values.
 */
export async function fetchClockStatus(): Promise<ClockStatus> {
  const uid = actorUid();
  if (!uid) return { ...NOT_CLOCKED_IN };

  try {
    const punches = await todaysPunches(uid);
    if (punches.length === 0) return { ...NOT_CLOCKED_IN };

    const latest = punches[0];
    const summary = buildSummary(await todaysAttendance(uid), latest, actorName());

    if (!latest.clockedOutAt) {
      const startMs = new Date(latest.clockedInAt).getTime();
      const elapsed = Number.isNaN(startMs) ? 0 : Math.max(0, Math.floor((Date.now() - startMs) / 1000));
      return { clockedIn: true, inTime: hhmm(latest.clockedInAt), outTime: null, elapsedSeconds: elapsed, lastPunch: summary };
    }

    const inMs = new Date(latest.clockedInAt).getTime();
    const outMs = new Date(latest.clockedOutAt).getTime();
    const worked = Number.isNaN(inMs) || Number.isNaN(outMs) ? 0 : Math.max(0, Math.floor((outMs - inMs) / 1000));
    return {
      clockedIn: false,
      inTime: hhmm(latest.clockedInAt),
      outTime: hhmm(latest.clockedOutAt),
      elapsedSeconds: worked,
      lastPunch: summary,
    };
  } catch (err) {
    console.warn('[attendance] fetchClockStatus failed — treating as not clocked in', err);
    return { ...NOT_CLOCKED_IN };
  }
}

/**
 * Clock out (close every open punch for today) or clock in (reopen today's row
 * if one exists, else create it) + sync the companion `attendance` doc.
 */
export async function toggleClock(input: ClockToggleInput): Promise<void> {
  const uid = actorUid();
  if (!uid) throw new Error('toggleClock: no Firebase Auth UID — clock_ins.staffId is required by the security rules');
  const name = actorName(input.staffName);
  const role = actorRole();
  const now = new Date();
  const today = isoDate(now);
  const attId = `${today}_${uid}`;

  const punches = await todaysPunches(uid);
  const openPunches = punches.filter((p) => !p.clockedOutAt);

  if (openPunches.length > 0) {
    // Clock OUT — close every open punch (guards against an earlier duplicate).
    let workedHours: number | undefined;
    for (const p of openPunches) {
      const inMs = new Date(p.clockedInAt).getTime();
      const h = Number.isNaN(inMs) ? undefined : Math.max(0, Math.round(((now.getTime() - inMs) / 3_600_000) * 10) / 10);
      if (workedHours == null) workedHours = h;
      await patchDocument(CLOCK_INS, p.id, { clockedOutAt: serverTimestamp(), workedHours: h });
    }
    await setDocument(ATTENDANCE, attId, { note: 'GPS clock-in & out', hours: workedHours }, { merge: true });
    return;
  }

  const late = calculateAttendanceStatus(name, now);
  const geo = input.coords ? evaluateGeofence(input.coords.lat, input.coords.lng, input.coords.accuracyM) : null;
  const gps = {
    lat: input.coords?.lat ?? null,
    lng: input.coords?.lng ?? null,
    accuracyM: geo ? geo.accuracyM : null,
    distanceToSiteM: geo ? geo.distanceM : null,
  };

  if (punches.length > 0) {
    // Today already has a (closed) punch — reopen it, never add a second doc.
    await patchDocument(CLOCK_INS, punches[0].id, {
      ...gps,
      clockedOutAt: null,
      workedHours: null,
      ...(input.bypassUsed ? { bypassUsed: true } : {}),
    });
  } else {
    await createDocument(CLOCK_INS, {
      staffId: uid,
      staffName: name,
      role,
      date: today,
      ...gps,
      clockedInAt: serverTimestamp(),
      ...(input.bypassUsed ? { bypassUsed: true } : {}),
    });
  }

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
  // "Half-day" exactly — the reference's STATUS_OPTIONS value, which its report
  // and payroll filters match on.
  half: 'Half-day',
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
