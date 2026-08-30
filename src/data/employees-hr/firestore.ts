/**
 * Live `employees` reader (Track B, read-only). Writes stay on `mock-api.ts`,
 * and `fetchApprovals` / `approveMonth` stay mock (no live collection).
 *
 * Live shape (sampled 2026-08-30): { id (= doc id), name, email, role, appRole,
 *   department, location, status ("Active"), isProductionWorker, reportsTo
 *   (doc id or ""), basicSalaryNPR, bankName, bankAccount, bankBranch,
 *   panNumber, phone, address, joinDate, createdAt, updatedAt, updatedBy,
 *   schedule* }
 *
 * Gaps handled locally (see plan §Batch 2):
 *   - mobile `id`/`reportsTo` are numbers → sequential ids assigned over the
 *     doc-id-sorted list, with a doc-id → number map so `reportsTo` resolves
 *   - no payroll input fields (`allow`/`otH`/`bonus`/`absent`/`late`/`tax`) → 0;
 *     payroll is computed on screen and can be synced from Attendance
 */

import { collection, getDocs } from 'firebase/firestore';

import type { AvatarTint } from '@/components/ui/avatar';
import { num, str } from '@/lib/firestore/normalise';
import { getDb } from '@/lib/firebase';

import type { Employee } from './types';

const TINTS: AvatarTint[] = ['dark', 'mint', 'clay', 'draft', 'amber'];

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '—';
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
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
    return {
      id: i + 1,
      code: `EMP${String(i + 1).padStart(3, '0')}`,
      name,
      role: str(d.role).trim(),
      dept: str(d.department).trim() || 'General',
      active: !/inactive|disabled|left/i.test(str(d.status)),
      joined: str(d.joinDate).trim(),
      reportsTo: managerDocId && idOf.has(managerDocId) ? idOf.get(managerDocId) : undefined,
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
