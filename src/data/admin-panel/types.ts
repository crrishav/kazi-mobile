export type AccessLevel = 0 | 1 | 2;

export type RoleKey = 'sup' | 'pm' | 'acct' | 'hr' | 'store';

export interface Role {
  key: RoleKey;
  label: string;
  people: number;
  meta: string;
}

export type SectionId =
  | 'dash'
  | 'prod'
  | 'qc'
  | 'inv'
  | 'purch'
  | 'tasks'
  | 'bill'
  | 'acct'
  | 'fin'
  | 'budget'
  | 'sales'
  | 'cust'
  | 'hr'
  | 'att'
  | 'dir'
  | 'msg'
  | 'mkt'
  | 'admin'
  | 'export'
  | 'audit';

export interface SectionDef {
  id: SectionId;
  name: string;
  note: string;
  /** Only unlocked when the active role is 'hr' — every other role sees it locked. */
  sensitive?: boolean;
  /** A fixed lock reason shown to every role regardless of `sensitive`. */
  lock?: string;
}

export interface SectionGroup {
  title: string;
  items: SectionDef[];
}

export type PermissionMatrix = Record<RoleKey, Record<SectionId, AccessLevel>>;

export interface DiffRow {
  id: SectionId;
  name: string;
  group: string;
  from: AccessLevel;
  to: AccessLevel;
}
