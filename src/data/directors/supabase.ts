/**
 * The role register, read live from Postgres.
 *
 * Four sources, all readable by any signed-in person:
 *   - `positions`            — the roles themselves (id, label, description)
 *   - `sections`             — display labels and ordering for the app's screens
 *   - `position_permissions` — the matrix: which sections a role sees and edits
 *   - `fs_employees`         — the staff roster (migration 0102 opens the
 *                              directory fields to everyone and masks pay), so
 *                              this never needs the tier-gated `people` table
 *
 * The reference tables are hit directly rather than through a compat view —
 * they never existed in Firestore, so there is nothing to be compatible with.
 * `auth/supabase-profile.ts` takes the same shortcut.
 *
 * Nothing here re-derives access: what a role can do is whatever its rows say,
 * including where that disagrees with the seed migration (0003's matrix has
 * since been edited in place — the live table wins).
 */

import { getSupabase } from '@/lib/supabase';
import { bool, num, str } from '@/lib/firestore/normalise';
import { readCollection, type DocData } from '@/lib/supabase/read';

import type { Role, RoleDirectory, RoleHolder, RoleSection } from './types';
import { isActiveStatus, locationOf, makeHolder, sortHolders, sortRoles } from './utils';

async function rows(table: string, columns: string): Promise<DocData[]> {
  const { data, error } = await getSupabase().from(table).select(columns);
  if (error) {
    throw new Error(`${table}: ${error.message}${error.code ? ` [${error.code}]` : ''}`);
  }
  return (data ?? []) as unknown as DocData[];
}

/** A roster row plus the raw position id that joins it back to `positions`. */
interface Staffer {
  holder: RoleHolder;
  positionId: string;
}

function toStaffer(id: string, d: DocData): Staffer | null {
  const name = str(d.name).trim();
  if (!name) return null;
  return {
    // `fs_employees` carries both `positionId` and `role`; the id is what joins,
    // the label is only a rendering of it, so the label is dropped here.
    positionId: str(d.positionId).trim(),
    holder: makeHolder({
      id,
      name,
      email: str(d.email).trim(),
      location: locationOf(str(d.location)),
      department: str(d.department).trim(),
      active: isActiveStatus(str(d.status)),
    }),
  };
}

export async function fetchRoleDirectory(): Promise<RoleDirectory> {
  const [positionRows, sectionRows, permRows, people] = await Promise.all([
    rows('positions', 'id, label, description'),
    rows('sections', 'id, label, sort_order'),
    rows('position_permissions', 'position_id, section_id, can_view, can_edit'),
    readCollection<Staffer>('employees', toStaffer),
  ]);

  const sectionLabel = new Map<string, string>();
  const sectionOrder = new Map<string, number>();
  for (const s of sectionRows) {
    const id = str(s.id).trim();
    if (!id) continue;
    sectionLabel.set(id, str(s.label).trim() || id);
    sectionOrder.set(id, num(s.sort_order));
  }

  const sectionsByPosition = new Map<string, RoleSection[]>();
  for (const p of permRows) {
    if (!bool(p.can_view)) continue;
    const positionId = str(p.position_id).trim();
    const sectionId = str(p.section_id).trim();
    // A grant naming a section that no longer exists has nothing to render.
    if (!positionId || !sectionLabel.has(sectionId)) continue;
    const list = sectionsByPosition.get(positionId) ?? [];
    list.push({ id: sectionId, label: sectionLabel.get(sectionId)!, canEdit: bool(p.can_edit) });
    sectionsByPosition.set(positionId, list);
  }
  for (const list of sectionsByPosition.values()) {
    list.sort((a, b) => (sectionOrder.get(a.id) ?? 0) - (sectionOrder.get(b.id) ?? 0));
  }

  const holdersByPosition = new Map<string, RoleHolder[]>();
  const known = new Set(positionRows.map((p) => str(p.id).trim()));
  const unassigned: RoleHolder[] = [];
  for (const { holder, positionId } of people) {
    if (!positionId || !known.has(positionId)) {
      unassigned.push(holder);
      continue;
    }
    holdersByPosition.set(positionId, [...(holdersByPosition.get(positionId) ?? []), holder]);
  }

  const roles: Role[] = positionRows.map((p) => {
    const id = str(p.id).trim();
    return {
      id,
      label: str(p.label).trim() || id,
      description: str(p.description).trim(),
      holders: sortHolders(holdersByPosition.get(id) ?? []),
      sections: sectionsByPosition.get(id) ?? [],
    };
  });

  return { roles: sortRoles(roles), unassigned: sortHolders(unassigned) };
}
