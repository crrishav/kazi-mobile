/**
 * Live `employees` reader. Writes live in `firestore-write.ts`;
 * `fetchApprovals` / `approveMonth` stay mock (no live collection).
 *
 * Live shape (`fs_employees`, sampled 2026-09-05): { id (= doc id), name, email,
 *   role (the position's label, derived — never written back), positionId,
 *   department, location, status ("Active"), isProductionWorker, reportsTo
 *   (doc id or null), basicSalaryNPR, bankName, bankAccount, bankBranch,
 *   panNumber, phone, address, joinDate, createdAt, updatedAt, schedule* }
 *
 * The personal / financial columns are masked by the view unless the caller is
 * the person themself or holds `employees` at tier >= 2 (migration 0102), so
 * they legitimately arrive null — `str` / `num` flatten that to '' / 0.
 *
 * Gaps handled locally (see plan §Batch 2):
 *   - mobile `id`/`reportsTo` are numbers → sequential ids assigned over the
 *     doc-id-sorted list, with a doc-id → number map so `reportsTo` resolves
 *   - no payroll input fields (`allow`/`otH`/`bonus`/`absent`/`late`/`tax`) → 0;
 *     payroll is computed on screen and can be synced from Attendance
 */

import type { AvatarTint } from '@/components/ui/avatar';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { arr, num, str } from '@/lib/firestore/normalise';
import { collection, getDb, getDocs } from '@/lib/supabase/firestore-compat';

import { POSITIONS } from './mock';
import type { Employee, EmployeeLocation, Position, ScheduleOverrides } from './types';

const TINTS: AvatarTint[] = ['dark', 'mint', 'clay', 'draft', 'amber'];

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '—';
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
}

/** `{ Tue: { start, end } }` — a jsonb blob, so every field is re-checked. */
function overridesOf(raw: unknown): ScheduleOverrides {
  const out: ScheduleOverrides = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  for (const [day, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!v || typeof v !== 'object') continue;
    const o = v as Record<string, unknown>;
    const start = str(o.start).trim();
    const end = str(o.end).trim();
    if (start || end) out[day.slice(0, 3)] = { start, end };
  }
  return out;
}

function locationOf(raw: unknown): EmployeeLocation {
  const v = str(raw).trim().toLowerCase();
  return v === 'uk' ? 'uk' : v === 'nepal' ? 'nepal' : '';
}

interface RawEmployee {
  docId: string;
  data: Record<string, unknown>;
}

export async function fetchEmployees(): Promise<Employee[]> {
  const snap = await getDocs(collection(getDb(), 'employees'));

  const raws: RawEmployee[] = snap.docs
    .map((d) => ({ docId: d.id, data: d.data() as Record<string, unknown> }))
    .filter((r) => str(r.data.name).trim())
    .sort((a, b) => a.docId.localeCompare(b.docId));

  // Stable doc-id → sequential numeric id, so `reportsTo` can be resolved.
  const idOf = new Map<string, number>();
  raws.forEach((r, i) => idOf.set(r.docId, i + 1));

  return raws.map((r, i) => {
    const d = r.data;
    const name = str(d.name).trim();
    const managerDocId = str(d.reportsTo).trim();
    const start = str(d.scheduleStart).trim();
    const end = str(d.scheduleEnd).trim();
    return {
      id: i + 1,
      code: `EMP${String(i + 1).padStart(3, '0')}`,
      name,
      role: str(d.role).trim(),
      positionId: str(d.positionId).trim(),
      dept: str(d.department).trim() || 'General',
      active: !/inactive|disabled|left/i.test(str(d.status)),
      joined: str(d.joinDate).trim(),
      reportsTo: managerDocId && idOf.has(managerDocId) ? idOf.get(managerDocId) : undefined,
      email: str(d.email).trim(),
      phone: str(d.phone).trim(),
      address: str(d.address).trim(),
      pan: str(d.panNumber).trim(),
      location: locationOf(d.location),
      productionWorker: d.isProductionWorker === true,
      schedule: {
        start,
        end,
        workingDays: arr<unknown>(d.scheduleWorkingDays).map((x) => str(x).trim().slice(0, 3)).filter(Boolean),
        dayOverrides: overridesOf(d.scheduleDayOverrides),
      },
      bank: str(d.bankName).trim(),
      acct: str(d.bankAccount).trim(),
      branch: str(d.bankBranch).trim(),
      basic: num(d.basicSalaryNPR),
      allow: 0,
      otH: 0,
      otR: 0,
      bonus: 0,
      adv: 0,
      absent: 0,
      late: 0,
      tax: 0,
      avatarInitials: initialsOf(name),
      avatarTint: TINTS[i % TINTS.length],
    };
  });
}

/**
 * The position list backing the sheet's Role picker. `positions` is a
 * reference table readable by any signed-in person (migration 0004), so this
 * goes straight at the table rather than through a compat view — the same
 * shortcut `auth/supabase-profile.ts` takes for the permission rows.
 */
export async function fetchPositions(): Promise<Position[]> {
  if (!isSupabaseConfigured) return POSITIONS;
  const { data, error } = await getSupabase()
    .from('positions')
    .select('id, label, tier')
    .order('tier', { ascending: false })
    .order('label');
  if (error) throw new Error(`fetchPositions: ${error.message}${error.code ? ` [${error.code}]` : ''}`);
  return ((data ?? []) as Record<string, unknown>[]).map((row) => ({
    id: str(row.id).trim(),
    label: str(row.label).trim(),
    tier: num(row.tier),
  }));
}
