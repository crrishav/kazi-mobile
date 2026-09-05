/**
 * Live writer for Roles & permissions.
 *
 * Every one of these hits the tables RLS itself reads, gated by
 * `app_can_edit('admin')` — so a role without admin edit rights gets a refusal
 * from the database, not just a greyed-out button. Unlike the rest of the app
 * these are NOT wrapped in `liveWrite`: a permission change that silently fell
 * back to a mock would show access the database never granted, which is the
 * one place this app cannot afford to lie. A failure throws and the draft
 * stays put so it can be retried.
 */

import { getSupabase } from '@/lib/supabase';

import { SUPER_ADMIN_TIER, type RoleDraft, type RoleFields } from './types';
import { flagsFor } from './utils';

function check(where: string, error: { message: string; code?: string } | null): void {
  if (error) throw new Error(`${where}: ${error.message}${error.code ? ` [${error.code}]` : ''}`);
}

/**
 * Commit a whole draft as one batch — a half-made change is never live.
 *
 * Order matters. While the role is still tier 4 the database refuses to reduce
 * any of its rows, so a demotion has to land first; the promotion goes last
 * because the trigger behind it fills in every page and finance tab itself.
 */
export async function saveRoleDraft({ roleId, draft }: { roleId: string; draft: RoleDraft }): Promise<void> {
  const sb = getSupabase();

  if (draft.superAdmin === false) {
    const { error } = await sb.from('positions').update({ tier: 0 }).eq('id', roleId);
    check('demote super admin', error);
  }

  const permRows = Object.entries(draft.levels).map(([sectionId, level]) => ({
    position_id: roleId,
    section_id: sectionId,
    ...flagsFor(level),
  }));
  if (permRows.length) {
    const { error } = await sb
      .from('position_permissions')
      .upsert(permRows, { onConflict: 'position_id,section_id' });
    check('position_permissions', error);
  }

  const tabRows = Object.entries(draft.tabs).map(([tabId, level]) => ({
    position_id: roleId,
    tab_id: tabId,
    ...flagsFor(level),
  }));
  if (tabRows.length) {
    const { error } = await sb
      .from('position_finance_tabs')
      .upsert(tabRows, { onConflict: 'position_id,tab_id' });
    check('position_finance_tabs', error);
  }

  // Page annotations are a property of the page, not of this role.
  for (const [sectionId, value] of Object.entries(draft.personal)) {
    const { error } = await sb.from('sections').update({ is_personal: value }).eq('id', sectionId);
    check(`sections/${sectionId}`, error);
  }

  if (draft.superAdmin === true) {
    const { error } = await sb.from('positions').update({ tier: SUPER_ADMIN_TIER }).eq('id', roleId);
    check('grant super admin', error);
  }
}

export async function createRole(fields: RoleFields): Promise<void> {
  const { error } = await getSupabase().from('positions').insert({
    id: fields.id,
    label: fields.label,
    description: fields.description,
    tier: fields.tier,
  });
  check('create role', error);
}

export async function updateRole(fields: RoleFields): Promise<void> {
  const { error } = await getSupabase()
    .from('positions')
    .update({ label: fields.label, description: fields.description, tier: fields.tier })
    .eq('id', fields.id);
  check('save role', error);
}

export async function deleteRole(roleId: string): Promise<void> {
  const { error } = await getSupabase().from('positions').delete().eq('id', roleId);
  check('delete role', error);
}

/**
 * Move somebody into a role, or out of every role (`positionId: null`).
 *
 * This writes to `people`, which RLS gates on `employees` edit — not on
 * `admin`. Someone can be allowed to shape a role without being allowed to
 * decide who holds it.
 */
export async function setPersonRole({ personId, positionId }: { personId: string; positionId: string | null }): Promise<void> {
  const { error } = await getSupabase()
    .from('people')
    .update({ position_id: positionId })
    .eq('id', personId);
  check('assign role', error);
}
