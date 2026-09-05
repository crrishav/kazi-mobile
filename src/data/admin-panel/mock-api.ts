/**
 * In-memory stand-in for the five permission tables, used only when Supabase
 * is unconfigured. It applies the same rules the database does — a tier-4 role
 * is granted everything, and its rows cannot be reduced while it is tier 4 —
 * so the screen behaves the same either way.
 */

import { simulateLatency } from '../mock/delay';

import { FINANCE_TABS, PEOPLE, PERMS, ROLES, SECTIONS, TAB_PERMS } from './mock';
import {
  SUPER_ADMIN_TIER,
  type AccessLevel,
  type AdminMatrix,
  type PersonRow,
  type RoleDraft,
  type RoleFields,
  type RoleRow,
  type SectionRow,
} from './types';

let roles: RoleRow[] = ROLES.map((r) => ({ ...r }));
let sections: SectionRow[] = SECTIONS.map((s) => ({ ...s }));
let perms: Record<string, Record<string, AccessLevel>> = clone(PERMS);
let tabPerms: Record<string, Record<string, AccessLevel>> = clone(TAB_PERMS);
let people: PersonRow[] = PEOPLE.map((p) => ({ ...p }));

function clone(m: Record<string, Record<string, AccessLevel>>): Record<string, Record<string, AccessLevel>> {
  const out: Record<string, Record<string, AccessLevel>> = {};
  for (const [k, v] of Object.entries(m)) out[k] = { ...v };
  return out;
}

export async function fetchAdminMatrix(): Promise<AdminMatrix> {
  await simulateLatency();
  return {
    roles: roles.map((r) => ({ ...r })).sort((a, b) => a.label.localeCompare(b.label)),
    sections: sections.map((s) => ({ ...s })),
    financeTabs: FINANCE_TABS.map((t) => ({ ...t })),
    perms: clone(perms),
    tabPerms: clone(tabPerms),
    people: people.map((p) => ({ ...p })),
  };
}

export async function saveRoleDraft({ roleId, draft }: { roleId: string; draft: RoleDraft }): Promise<void> {
  await simulateLatency(300);
  if (draft.superAdmin === false) {
    roles = roles.map((r) => (r.id === roleId ? { ...r, tier: 0 } : r));
  }
  perms[roleId] = { ...perms[roleId], ...draft.levels };
  tabPerms[roleId] = { ...tabPerms[roleId], ...draft.tabs };
  sections = sections.map((s) => (draft.personal[s.id] === undefined ? s : { ...s, isPersonal: draft.personal[s.id] }));
  if (draft.superAdmin === true) {
    roles = roles.map((r) => (r.id === roleId ? { ...r, tier: SUPER_ADMIN_TIER } : r));
    // The database does this with a trigger; the mock has to do it by hand.
    perms[roleId] = Object.fromEntries(sections.map((s) => [s.id, 'edit' as AccessLevel]));
    tabPerms[roleId] = Object.fromEntries(FINANCE_TABS.map((t) => [t.id, 'edit' as AccessLevel]));
  }
}

export async function createRole(fields: RoleFields): Promise<void> {
  await simulateLatency(250);
  roles = [...roles, { ...fields }];
  perms[fields.id] = {};
  tabPerms[fields.id] = {};
}

export async function updateRole(fields: RoleFields): Promise<void> {
  await simulateLatency(250);
  roles = roles.map((r) => (r.id === fields.id ? { ...r, ...fields } : r));
}

export async function deleteRole(roleId: string): Promise<void> {
  await simulateLatency(250);
  roles = roles.filter((r) => r.id !== roleId);
  delete perms[roleId];
  delete tabPerms[roleId];
}

export async function setPersonRole({ personId, positionId }: { personId: string; positionId: string | null }): Promise<void> {
  await simulateLatency(250);
  people = people.map((p) => (p.id === personId ? { ...p, positionId } : p));
}
