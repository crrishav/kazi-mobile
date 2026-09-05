/**
 * Live reader for Roles & permissions.
 *
 * `positions`, `sections`, `finance_tabs`, `position_permissions` and
 * `position_finance_tabs` are the real tables — not Firestore collections that
 * were migrated — so this goes straight at them rather than through a compat
 * view, the same shortcut `auth/supabase-profile.ts` and Employees'
 * `fetchPositions` already take. All five are readable by any signed-in person
 * (policy `read_all`); only `admin` edit rights let a write through.
 *
 * People come from `fs_employees`, which carries its own RLS: someone allowed
 * to shape a role but not to see Employees legitimately gets back only
 * themself. The screen renders that as "nobody assigned" rather than treating
 * it as an error — it is the database answering honestly.
 */

import { getSupabase } from '@/lib/supabase';
import { num, str } from '@/lib/firestore/normalise';

import type { AccessLevel, AdminMatrix, FinanceTabRow, PersonRow, RoleRow, SectionRow } from './types';
import { levelOf } from './utils';

function failed(where: string, error: { message: string; code?: string }): Error {
  return new Error(`${where}: ${error.message}${error.code ? ` [${error.code}]` : ''}`);
}

type Row = Record<string, unknown>;

export async function fetchAdminMatrix(): Promise<AdminMatrix> {
  const sb = getSupabase();
  const [posRes, secRes, tabRes, permRes, tabPermRes, peopleRes] = await Promise.all([
    sb.from('positions').select('id, label, tier, description'),
    sb.from('sections').select('id, label, is_personal, sort_order'),
    sb.from('finance_tabs').select('id, label, sort_order'),
    sb.from('position_permissions').select('position_id, section_id, can_view, can_edit'),
    sb.from('position_finance_tabs').select('position_id, tab_id, can_view, can_edit'),
    sb.from('fs_employees').select('*'),
  ]);

  if (posRes.error) throw failed('positions', posRes.error);
  if (secRes.error) throw failed('sections', secRes.error);
  if (tabRes.error) throw failed('finance_tabs', tabRes.error);
  if (permRes.error) throw failed('position_permissions', permRes.error);
  if (tabPermRes.error) throw failed('position_finance_tabs', tabPermRes.error);
  if (peopleRes.error) throw failed('employees', peopleRes.error);

  const roles: RoleRow[] = ((posRes.data ?? []) as Row[])
    .map((r) => ({
      id: str(r.id).trim(),
      label: str(r.label).trim(),
      description: str(r.description).trim() || null,
      tier: num(r.tier),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const sections: SectionRow[] = ((secRes.data ?? []) as Row[])
    .map((r) => ({
      id: str(r.id).trim(),
      label: str(r.label).trim(),
      isPersonal: r.is_personal === true,
      sortOrder: r.sort_order == null ? 99 : num(r.sort_order),
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const financeTabs: FinanceTabRow[] = ((tabRes.data ?? []) as Row[])
    .map((r) => ({
      id: str(r.id).trim(),
      label: str(r.label).trim(),
      sortOrder: r.sort_order == null ? 99 : num(r.sort_order),
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const perms: Record<string, Record<string, AccessLevel>> = {};
  for (const r of ((permRes.data ?? []) as Row[])) {
    const pos = str(r.position_id).trim();
    (perms[pos] ??= {})[str(r.section_id).trim()] = levelOf({
      can_view: r.can_view === true,
      can_edit: r.can_edit === true,
    });
  }

  const tabPerms: Record<string, Record<string, AccessLevel>> = {};
  for (const r of ((tabPermRes.data ?? []) as Row[])) {
    const pos = str(r.position_id).trim();
    (tabPerms[pos] ??= {})[str(r.tab_id).trim()] = levelOf({
      can_view: r.can_view === true,
      can_edit: r.can_edit === true,
    });
  }

  const people: PersonRow[] = ((peopleRes.data ?? []) as Row[])
    .map((r) => ({
      id: str(r.id).trim(),
      name: str(r.name).trim(),
      email: str(r.email).trim(),
      department: str(r.department).trim(),
      positionId: str(r.positionId).trim() || null,
      active: !/inactive|disabled|left/i.test(str(r.status)),
    }))
    .filter((p) => p.id && p.name)
    .sort((a, b) => a.name.localeCompare(b.name));

  return { roles, sections, financeTabs, perms, tabPerms, people };
}
