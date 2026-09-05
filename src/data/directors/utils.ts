import { tintFromSeed } from '@/components/ui/avatar';

import type { Role, RoleHolder, RoleHolderLocation } from './types';

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '—';
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
}

export function locationOf(raw: string): RoleHolderLocation {
  const v = raw.trim().toLowerCase();
  return v === 'uk' ? 'uk' : v === 'nepal' ? 'nepal' : '';
}

/** Matches the employees module's reading of the live `status` string. */
export function isActiveStatus(status: string): boolean {
  return !/inactive|disabled|left|resigned/i.test(status);
}

export function makeHolder(fields: Omit<RoleHolder, 'initials' | 'tint'>): RoleHolder {
  const initials = initialsOf(fields.name);
  return { ...fields, initials, tint: tintFromSeed(fields.id || initials) };
}

/** Active first, then alphabetical — a vacant-ish role shouldn't lead with a leaver. */
export function sortHolders(holders: RoleHolder[]): RoleHolder[] {
  return [...holders].sort(
    (a, b) => Number(b.active) - Number(a.active) || a.name.localeCompare(b.name),
  );
}

/**
 * The register's running order: Director first, then the order the screen has
 * always shown.
 *
 * That order came from `positions.tier` descending, alphabetical within each
 * tier, back when the screen grouped by tier. Tier is no longer on the `Role`
 * shape, so the sequence it produced is written out here — with Director lifted
 * to the front, since alphabetical within the top tier put Developer ahead of
 * the role a reader is actually looking for.
 *
 * A role added later that is not on this list sorts alphabetically after the
 * ones that are.
 */
const ROLE_ORDER = [
  'director',
  'developer',
  'system-admin',
  'operations-head',
  'accountant',
  'content-coordinator',
  'fashion-designer',
  'marketing-coordinator',
  'operations-intern',
];

export function sortRoles(roles: Role[]): Role[] {
  const rank = (r: Role) => {
    const i = ROLE_ORDER.indexOf(r.id);
    return i === -1 ? ROLE_ORDER.length : i;
  };
  return [...roles].sort((a, b) => rank(a) - rank(b) || a.label.localeCompare(b.label));
}
