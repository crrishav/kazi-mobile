import type { AvatarTint } from '@/components/ui/avatar';

/** Where a person sits. `''` when the row doesn't say. */
export type RoleHolderLocation = 'nepal' | 'uk' | '';

/** One person, as seen from a role — the staff roster fields only, no pay. */
export interface RoleHolder {
  /** The `people` row id. */
  id: string;
  name: string;
  email: string;
  location: RoleHolderLocation;
  department: string;
  active: boolean;
  initials: string;
  tint: AvatarTint;
}

/** A section a role can open, carrying the section table's own display label. */
export interface RoleSection {
  id: string;
  label: string;
  canEdit: boolean;
}

/** A row of `positions`, with its people and its slice of the permission matrix. */
export interface Role {
  id: string;
  label: string;
  description: string;
  holders: RoleHolder[];
  /** Everything the role can view, in the sections table's own order. */
  sections: RoleSection[];
}

export interface RoleDirectory {
  roles: Role[];
  /** Staff whose `positionId` is empty or names a role that no longer exists. */
  unassigned: RoleHolder[];
}
