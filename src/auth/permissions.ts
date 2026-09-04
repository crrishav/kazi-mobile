/**
 * Role-based access control, ported from the reference app's
 * `src/utils/permissions.js` (`sectionVisible` / `sectionCanEdit` /
 * `financeTabAllowed` + `NAV_BY_ROLE` + `DEFAULT_NEPAL_ADMIN_PERMISSIONS`).
 *
 * Mock-era: the profile comes from `mock-auth` (role derived from the email,
 * plus a dev role switcher). When Firebase Auth lands, only the profile
 * *source* changes — every function below stays as-is.
 *
 * Per-user overrides (`profile.permissions`, shape mirrors the live
 * `users/{uid}.permissions`) beat the role default:
 *   - `permissions[section] === true  ` → force-visible + editable
 *   - `permissions[section] === false ` → force-hidden
 *   - `permissions.finance === { expenses: true, ... }` → per-tab Finance gate
 */

import { isAtLeast, ROLE_RANK, type Role } from './roles';

/** One entry per real module/route (the More hub + the 4 tabs). */
export type SectionId =
  | 'dashboard'
  | 'tasks'
  | 'inventory'
  | 'finance'
  | 'sales'
  | 'order-management'
  | 'customers'
  | 'billing'
  | 'purchases'
  | 'production'
  | 'quality-control'
  | 'accounting'
  | 'budget-requirements'
  | 'employees-hr'
  | 'attendance'
  | 'marketing'
  // Chat. The id stays `messenger`: it is the primary key of `sections` in
  // Postgres and the join key in `position_permissions` — only the label moved.
  | 'messenger'
  | 'directors'
  | 'admin-panel'
  | 'changelog'
  | 'bug-report';

/** The 10 Finance sub-tabs, each gated individually (reference `financeTabAllowed`). */
export type FinanceTabId =
  | 'expenses'
  | 'purchases'
  | 'vat-bills'
  | 'journal'
  | 'ledger'
  | 'pnl'
  | 'balance-sheet'
  | 'bank'
  | 'order-pnl'
  | 'kpi';

export const FINANCE_TABS: FinanceTabId[] = [
  'expenses', 'purchases', 'vat-bills', 'journal', 'ledger',
  'pnl', 'balance-sheet', 'bank', 'order-pnl', 'kpi',
];

export type PermissionOverrides = Partial<Record<Exclude<SectionId, 'finance'>, boolean>> & {
  /** `finance` alone can also be a per-sub-tab map. */
  finance?: boolean | Partial<Record<FinanceTabId, boolean>>;
};

export interface Profile {
  email: string;
  name: string;
  initials: string;
  role: Role;
  /** Free-text job title (reference `jobRole`), display-only. */
  jobRole?: string;
  /** `positions.id` in Postgres. Absent on the legacy Firebase path. */
  positionId?: string;
  permissions?: PermissionOverrides;
  /** Firebase Auth UID — present on the real-auth path only. */
  uid?: string;
  /** Operating location (`nepal` / `uk`), display-only. */
  location?: 'nepal' | 'uk';
  /** `employees.status`; `Inactive` blocks access to the app. */
  status?: 'Active' | 'Inactive';
  /** AD ISO string — account creation date, shown on the Account screen. */
  createdAt?: string;
}

export const ALL_SECTIONS: SectionId[] = [
  'dashboard', 'tasks', 'inventory', 'finance', 'sales', 'order-management', 'customers', 'billing',
  'purchases', 'production', 'quality-control', 'accounting', 'budget-requirements',
  'employees-hr', 'attendance', 'marketing', 'messenger', 'directors', 'admin-panel', 'changelog',
  'bug-report',
];

/** Default nav per role (reference `NAV_BY_ROLE`). Overrides can still add/remove entries. */
export const NAV_BY_ROLE: Record<Role, SectionId[]> = {
  super_admin: ALL_SECTIONS,
  uk_admin: ALL_SECTIONS.filter((s) => s !== 'admin-panel'),
  nepal_admin: [
    'dashboard', 'tasks', 'inventory', 'finance', 'sales', 'order-management', 'customers', 'billing',
    'purchases', 'production', 'quality-control', 'accounting', 'budget-requirements',
    'employees-hr', 'attendance', 'marketing', 'messenger', 'changelog', 'bug-report',
  ],
  nepal_staff: [
    'dashboard', 'tasks', 'inventory', 'production', 'quality-control',
    'budget-requirements', 'attendance', 'marketing', 'messenger',
    'customers', 'sales', 'order-management', 'changelog', 'bug-report',
  ],
  employee: ['dashboard', 'tasks', 'attendance', 'messenger', 'budget-requirements', 'changelog', 'bug-report'],
};

/** Sections each role may edit (not just view). `'*'` = everything it can see. */
const EDIT_BY_ROLE: Record<Role, SectionId[] | '*'> = {
  super_admin: '*',
  uk_admin: '*',
  nepal_admin: '*',
  nepal_staff: ['tasks', 'attendance', 'messenger', 'production', 'quality-control', 'inventory', 'budget-requirements', 'marketing', 'order-management', 'bug-report'],
  employee: ['tasks', 'attendance', 'messenger', 'budget-requirements', 'bug-report'],
};

/**
 * The finance-heavy default the reference ships for the "accountant" persona
 * (a `nepal_admin` with these overrides on top of the general Nepal-admin nav).
 */
export const DEFAULT_NEPAL_ADMIN_PERMISSIONS: PermissionOverrides = {
  finance: { expenses: true, purchases: true, 'vat-bills': true, journal: true, ledger: true, pnl: true, 'balance-sheet': true, bank: true, 'order-pnl': true, kpi: true },
  billing: true,
  accounting: true,
  purchases: true,
  customers: true,
  'budget-requirements': true,
};

// ---- Resolvers ----

/** Is this section shown in the nav for this profile? */
export function sectionVisible(profile: Profile | null, id: SectionId): boolean {
  if (!profile) return false;
  const override = profile.permissions?.[id];
  if (override === true) return true;
  if (override === false) return false;
  if (id === 'finance' && profile.permissions?.finance && typeof profile.permissions.finance === 'object') {
    return Object.values(profile.permissions.finance).some(Boolean);
  }
  return NAV_BY_ROLE[profile.role].includes(id);
}

/** May this profile create / edit / delete inside this section? */
export function sectionCanEdit(profile: Profile | null, id: SectionId): boolean {
  if (!profile || !sectionVisible(profile, id)) return false;
  if (profile.permissions?.[id] === true) return true;
  const editable = EDIT_BY_ROLE[profile.role];
  return editable === '*' || editable.includes(id);
}

/** Is this one Finance sub-tab available to this profile? */
export function financeTabAllowed(profile: Profile | null, tab: FinanceTabId): boolean {
  if (!profile || !sectionVisible(profile, 'finance')) return false;
  const fin = profile.permissions?.finance;
  if (fin && typeof fin === 'object') return !!fin[tab];
  if (fin === true) return true;
  // No explicit finance override: Nepal-admin-and-up see every tab, others none.
  return isAtLeast(profile.role, 'nepal_admin');
}

/** Convenience: can this profile approve budget / payroll runs (UK director or above)? */
export function canApprove(profile: Profile | null): boolean {
  return !!profile && ROLE_RANK[profile.role] >= ROLE_RANK.uk_admin;
}
