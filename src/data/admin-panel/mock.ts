/**
 * Seed matrix for local development without a `.env`.
 *
 * Shaped exactly like the live tables — same section and finance-tab ids, same
 * `positions` columns — so the screen never has a mock-only notion of access.
 */

import type { AccessLevel, FinanceTabRow, PersonRow, RoleRow, SectionRow } from './types';

export const SECTIONS: SectionRow[] = [
  { id: 'dashboard', label: 'Dashboard', isPersonal: false, sortOrder: 0 },
  { id: 'tasks', label: 'Tasks', isPersonal: false, sortOrder: 1 },
  { id: 'attendance', label: 'Attendance', isPersonal: false, sortOrder: 2 },
  { id: 'payroll', label: 'Payroll', isPersonal: true, sortOrder: 3 },
  { id: 'production', label: 'Production', isPersonal: false, sortOrder: 4 },
  { id: 'quality_control', label: 'Quality Control', isPersonal: false, sortOrder: 5 },
  { id: 'inventory', label: 'Inventory', isPersonal: false, sortOrder: 6 },
  { id: 'library', label: 'Product Library', isPersonal: false, sortOrder: 7 },
  { id: 'orders', label: 'Orders', isPersonal: false, sortOrder: 8 },
  { id: 'sales', label: 'Sales', isPersonal: false, sortOrder: 9 },
  { id: 'customers', label: 'Customers', isPersonal: false, sortOrder: 10 },
  { id: 'billing', label: 'Billing', isPersonal: false, sortOrder: 11 },
  { id: 'purchases', label: 'Purchases', isPersonal: false, sortOrder: 12 },
  { id: 'finance', label: 'Finance', isPersonal: false, sortOrder: 13 },
  { id: 'accounting', label: 'Accounting', isPersonal: false, sortOrder: 14 },
  { id: 'budget', label: 'Budget Requests', isPersonal: false, sortOrder: 15 },
  { id: 'employees', label: 'Employees & HR', isPersonal: false, sortOrder: 16 },
  { id: 'marketing', label: 'Marketing', isPersonal: false, sortOrder: 17 },
  { id: 'content', label: 'Content Calendar', isPersonal: false, sortOrder: 18 },
  { id: 'messenger', label: 'Messenger', isPersonal: false, sortOrder: 19 },
  { id: 'directors', label: 'Directors', isPersonal: false, sortOrder: 20 },
  { id: 'admin', label: 'Admin Panel', isPersonal: false, sortOrder: 21 },
  { id: 'changelog', label: 'Changelog', isPersonal: false, sortOrder: 22 },
  { id: 'bug_report', label: 'Bug Reports', isPersonal: false, sortOrder: 23 },
];

export const FINANCE_TABS: FinanceTabRow[] = [
  { id: 'expenses', label: 'Expenses', sortOrder: 0 },
  { id: 'payroll', label: 'Payroll', sortOrder: 1 },
  { id: 'purchases', label: 'Purchases', sortOrder: 2 },
  { id: 'vat_bills', label: 'VAT Bills', sortOrder: 3 },
  { id: 'journal', label: 'Journal', sortOrder: 4 },
  { id: 'ledger', label: 'Ledger', sortOrder: 5 },
  { id: 'pl', label: 'P&L', sortOrder: 6 },
  { id: 'balance_sheet', label: 'Balance Sheet', sortOrder: 7 },
  { id: 'bank', label: 'Bank', sortOrder: 8 },
  { id: 'order_pl', label: 'Order P&L', sortOrder: 9 },
  { id: 'kpi', label: 'KPI', sortOrder: 10 },
];

export const ROLES: RoleRow[] = [
  { id: 'system-admin', label: 'System Admin', description: 'Full system access.', tier: 4 },
  { id: 'director', label: 'Director', description: 'Oversight across the business, light editing.', tier: 4 },
  { id: 'operations-head', label: 'Operations Head', description: 'Day-to-day owner of production, inventory and staff.', tier: 3 },
  { id: 'accountant', label: 'Accountant', description: 'Finance, accounting, billing, payroll and inventory.', tier: 2 },
  { id: 'fashion-designer', label: 'Fashion Designer', description: 'The product library, specs and sampling.', tier: 1 },
  { id: 'content-coordinator', label: 'Content Coordinator', description: 'Content planning, marketing and video editing.', tier: 1 },
];

const grant = (edit: string[], view: string[] = []): Record<string, AccessLevel> => {
  const out: Record<string, AccessLevel> = {};
  for (const id of view) out[id] = 'view';
  for (const id of edit) out[id] = 'edit';
  return out;
};

const everything = (): Record<string, AccessLevel> =>
  Object.fromEntries(SECTIONS.map((s) => [s.id, 'edit' as AccessLevel]));

export const PERMS: Record<string, Record<string, AccessLevel>> = {
  'system-admin': everything(),
  director: everything(),
  'operations-head': grant(
    ['tasks', 'attendance', 'production', 'quality_control', 'inventory', 'orders', 'messenger', 'bug_report'],
    ['dashboard', 'employees', 'sales', 'customers', 'budget', 'changelog'],
  ),
  accountant: grant(
    ['billing', 'purchases', 'finance', 'accounting', 'budget', 'inventory', 'payroll', 'messenger'],
    ['dashboard', 'tasks', 'orders', 'sales', 'customers', 'attendance', 'changelog', 'bug_report'],
  ),
  'fashion-designer': grant(
    ['library', 'tasks', 'messenger'],
    ['dashboard', 'orders', 'production', 'inventory', 'attendance', 'changelog', 'bug_report'],
  ),
  'content-coordinator': grant(
    ['content', 'marketing', 'tasks', 'messenger'],
    ['dashboard', 'customers', 'attendance', 'changelog', 'bug_report'],
  ),
};

const allTabs = (): Record<string, AccessLevel> =>
  Object.fromEntries(FINANCE_TABS.map((t) => [t.id, 'edit' as AccessLevel]));

export const TAB_PERMS: Record<string, Record<string, AccessLevel>> = {
  'system-admin': allTabs(),
  director: allTabs(),
  accountant: allTabs(),
  'operations-head': { kpi: 'view' },
};

export const PEOPLE: PersonRow[] = [
  { id: 'p1', name: 'Sarita Lama', email: 'sarita@kazi.example', department: 'Admin', positionId: 'system-admin', active: true },
  { id: 'p2', name: 'Anmol Shrestha', email: 'anmol@kazi.example', department: 'Operations', positionId: 'operations-head', active: true },
  { id: 'p3', name: 'Sunam Deepa', email: 'sunam@kazi.example', department: 'Finance', positionId: 'accountant', active: true },
  { id: 'p4', name: 'Sarbagya Thapa', email: 'sarbagya@kazi.example', department: 'Design', positionId: 'fashion-designer', active: true },
  { id: 'p5', name: 'Nisha Gurung', email: 'nisha@kazi.example', department: 'Marketing', positionId: 'content-coordinator', active: true },
  { id: 'p6', name: 'Bimal Rai', email: 'bimal@kazi.example', department: 'Production', positionId: null, active: true },
];
