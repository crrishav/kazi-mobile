/**
 * Live attendance readers (Track B, read-only): `attendance` (daily records) and
 * `clock_ins` (GPS punches). Writes + `fetchClockStatus` (live session state,
 * no source) stay on `mock-api.ts`.
 *
 * Live shapes (sampled 2026-08-30):
 *   attendance  { staffId, staffName, role, date ("YYYY-MM-DD"), status
 *                 ("Present"/"Late"/…), hours (number), note, loggedBy, createdAt }
 *   clock_ins   { staffId, staffName, role, date, clockedInAt, lat, lng,
 *                 accuracyM, distanceToSiteM }
 *
 * Gaps handled locally (see plan §Batch 3):
 *   - `TeamMember.id` (number) → sequential over the staff-id-sorted list
 *   - no clock times on daily records → `times` label derived from status
 *   - no OT field → `otHours: '0h 00m'`
 *   - `month` tallies aggregate ALL of a staffer's records (live data is sparse)
 */

import { collection, getDocs } from 'firebase/firestore';

import type { AvatarTint } from '@/components/ui/avatar';
import { num, str, tsToISO } from '@/lib/firestore/normalise';
import { getDb } from '@/lib/firebase';

import { findEmployee, readEmployees } from './live-shared';

import type { AttendanceStatus, ClockPunch, TeamMember } from './types';

const TINTS: AvatarTint[] = ['mint', 'clay', 'draft', 'amber', 'dark'];

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '—';
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
}

function mapStatus(raw: unknown): AttendanceStatus {
  const s = str(raw).trim().toLowerCase();
  if (s.startsWith('late')) return 'late';
  if (s.startsWith('absent')) return 'absent';
  if (s.startsWith('half')) return 'half';
  if (s.startsWith('leave')) return 'leave';
  return 'present';
}

function timesFor(status: AttendanceStatus): string {
  if (status === 'absent') return '— → —';
  if (status === 'leave') return 'Approved leave';
  if (status === 'half') return '08:00 → 12:00';
  return '—';
}

interface DailyRow {
  staffId: string;
  staffName: string;
  role: string;
  dateISO: string;
  status: AttendanceStatus;
  hours: number;
}

export async function fetchTeam(): Promise<TeamMember[]> {
  // The directory is read alongside so each row carries the `employees` doc id
  // the admin sheet needs to edit that person's work schedule.
  const [snap, employees] = await Promise.all([getDocs(collection(getDb(), 'attendance')), readEmployees()]);
  const rows: DailyRow[] = snap.docs
    .map((d) => {
      const x = d.data() as Record<string, unknown>;
      return {
        staffId: str(x.staffId).trim() || str(x.staffName).trim(),
        staffName: str(x.staffName).trim(),
        role: str(x.role).trim(),
        dateISO: str(x.date).trim() || tsToISO(x.createdAt).slice(0, 10),
        status: mapStatus(x.status),
        hours: num(x.hours),
      };
    })
    .filter((r) => r.staffId && r.staffName);

  // Grouped by NAME, not by `staffId`: the live data files several people under
  // two ids (an Auth UID plus an older email-derived one), which used to list
  // them twice — once with a stale record and once with the real one.
  const byName = new Map<string, DailyRow[]>();
  for (const r of rows) {
    const key = r.staffName.trim().toLowerCase();
    const list = byName.get(key) ?? [];
    list.push(r);
    byName.set(key, list);
  }

  const names = [...byName.keys()].sort();
  return names.map((key, i) => {
    const recs = [...(byName.get(key) ?? [])].sort((a, b) => a.dateISO.localeCompare(b.dateISO));
    const latest = recs[recs.length - 1];
    const tally = { present: 0, late: 0, absent: 0, half: 0, leave: 0 };
    let hoursSum = 0;
    for (const r of recs) {
      tally[r.status] += 1;
      hoursSum += r.hours;
    }
    // Every id this person's rows live under; the newest is the one an edit is
    // written to, so a correction lands where the app and the web both look.
    const staffIds = [...new Set([...recs].reverse().map((r) => r.staffId))];
    const employee = findEmployee(employees, { uid: latest.staffId, name: latest.staffName });
    return {
      id: i + 1,
      staffId: latest.staffId,
      staffIds,
      employeeDocId: employee?.docId ?? null,
      name: latest.staffName,
      role: latest.role || 'Staff',
      initials: initialsOf(latest.staffName),
      avatarTint: TINTS[i % TINTS.length],
      status: latest.status,
      times: timesFor(latest.status),
      hours: latest.hours ? `${latest.hours}h 00m` : '0h 00m',
      month: {
        ...tally,
        otHours: '0h 00m',
        hoursMTD: `${Math.round(hoursSum)}h 00m`,
      },
    };
  });
}

function mapPunchDoc(id: string, d: Record<string, unknown>): ClockPunch | null {
  const staffName = str(d.staffName).trim();
  const clockedInAt = str(d.clockedInAt).trim() || tsToISO(d.createdAt);
  if (!staffName || !clockedInAt) return null;
  return {
    id,
    staffName,
    date: str(d.date).trim() || clockedInAt.slice(0, 10),
    clockedInAt,
    clockedOutAt: str(d.clockedOutAt).trim() || null,
    lat: d.lat == null ? null : num(d.lat),
    lng: d.lng == null ? null : num(d.lng),
    accuracyM: d.accuracyM == null ? null : num(d.accuracyM),
    distanceToSiteM: d.distanceToSiteM == null ? null : num(d.distanceToSiteM),
    bypassUsed: false,
    status: /late/i.test(str(d.status)) ? 'Late' : 'Present',
    lateMinutes: num(d.lateMinutes),
    lateCutApplied: /true/i.test(str(d.lateCutApplied)),
  };
}

export async function fetchClockPunches(): Promise<ClockPunch[]> {
  const snap = await getDocs(collection(getDb(), 'clock_ins'));
  return snap.docs
    .map((d) => mapPunchDoc(d.id, d.data() as Record<string, unknown>))
    .filter((p): p is ClockPunch => p != null)
    .sort((a, b) => b.clockedInAt.localeCompare(a.clockedInAt));
}
