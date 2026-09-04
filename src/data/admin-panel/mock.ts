import type { AccessLevel, PermissionMatrix, Role, SectionGroup } from './types';

export const GROUPS: SectionGroup[] = [
  {
    title: 'Operations',
    items: [
      { id: 'dash', name: 'Dashboard', note: 'Line output, shift KPIs' },
      { id: 'prod', name: 'Production', note: 'Plan, cut & sew progress' },
      { id: 'qc', name: 'Quality Control', note: 'Holds, defect logs' },
      { id: 'inv', name: 'Inventory', note: 'Fabric, trim, finished goods' },
      { id: 'purch', name: 'Purchases', note: 'POs to mills & suppliers' },
      { id: 'tasks', name: 'Tasks', note: 'Assigned work, checklists' },
    ],
  },
  {
    title: 'Finance',
    items: [
      { id: 'bill', name: 'Billing', note: 'Invoices, FOB documents' },
      { id: 'acct', name: 'Accounting', note: 'Ledger, VAT returns' },
      { id: 'fin', name: 'Finance', note: 'Cashflow, margins' },
      { id: 'budget', name: 'Budget & Reqs', note: 'Requisitions, approvals' },
      { id: 'sales', name: 'Sales', note: 'Order book, costing' },
      { id: 'cust', name: 'Customers', note: 'Buyer accounts, terms' },
    ],
  },
  {
    title: 'People',
    items: [
      { id: 'hr', name: 'Employees & HR', note: 'Roll, contracts, payroll', sensitive: true },
      { id: 'att', name: 'Attendance', note: 'Shifts, leave, overtime' },
      { id: 'dir', name: 'Directors', note: 'Leadership directory' },
      { id: 'msg', name: 'Chat', note: 'Threads and broadcasts' },
      { id: 'mkt', name: 'Marketing', note: 'Brand assets, enquiries' },
    ],
  },
  {
    title: 'System',
    items: [
      { id: 'admin', name: 'Admin panel', note: 'This screen · roles & access', lock: 'systems admin only' },
      { id: 'export', name: 'Data exports', note: 'CSV and accounting sync' },
      { id: 'audit', name: 'Audit log', note: 'Who changed what, when' },
    ],
  },
];

export const ROLES: Role[] = [
  { key: 'sup', label: 'Line supervisor', people: 14, meta: 'Sewing lines 1–3 · floor tablets' },
  { key: 'pm', label: 'Production mgr', people: 4, meta: 'Plan owners · plant office' },
  { key: 'acct', label: 'Accounts', people: 3, meta: 'Back office · Kathmandu' },
  { key: 'hr', label: 'HR & payroll', people: 2, meta: 'Payroll run · SSF filings' },
  { key: 'store', label: 'Store keeper', people: 5, meta: 'Fabric store · goods in' },
];

/** Seed access matrix — role -> section -> 0 hidden / 1 view / 2 edit. */
export const BASE_PERMISSIONS: PermissionMatrix = {
  sup: { dash: 1, prod: 2, qc: 1, inv: 1, purch: 0, tasks: 2, bill: 0, acct: 0, fin: 0, budget: 1, sales: 0, cust: 0, hr: 0, att: 2, dir: 1, msg: 2, mkt: 0, admin: 0, export: 0, audit: 0 },
  pm: { dash: 1, prod: 2, qc: 2, inv: 2, purch: 1, tasks: 2, bill: 0, acct: 0, fin: 1, budget: 2, sales: 1, cust: 1, hr: 0, att: 2, dir: 1, msg: 2, mkt: 0, admin: 0, export: 1, audit: 0 },
  acct: { dash: 1, prod: 1, qc: 0, inv: 1, purch: 2, tasks: 1, bill: 2, acct: 2, fin: 2, budget: 2, sales: 1, cust: 2, hr: 0, att: 1, dir: 1, msg: 2, mkt: 0, admin: 0, export: 2, audit: 1 },
  hr: { dash: 1, prod: 0, qc: 0, inv: 0, purch: 0, tasks: 1, bill: 0, acct: 0, fin: 0, budget: 1, sales: 0, cust: 0, hr: 2, att: 2, dir: 1, msg: 2, mkt: 0, admin: 0, export: 1, audit: 1 },
  store: { dash: 1, prod: 1, qc: 1, inv: 2, purch: 1, tasks: 2, bill: 0, acct: 0, fin: 0, budget: 1, sales: 0, cust: 0, hr: 0, att: 1, dir: 1, msg: 2, mkt: 0, admin: 0, export: 0, audit: 0 },
};

export const LEVEL_LABEL: Record<AccessLevel, string> = { 0: 'hidden', 1: 'view', 2: 'edit' };

/** The signed-in admin performing changes — hardcoded like every other module's "current user" until real auth lands. */
export const CURRENT_ADMIN = { name: 'Sarita Lama', initials: 'SL', username: 'sarita.lama' };

/**
 * The "hidden" chip's foreground is more muted than any existing theme token
 * (view/edit chips map exactly onto surfaceRaised/textSecondary and
 * accentWash/accentWashText — only this one needs a literal, per the
 * Attendance STATUS_RAMP precedent of adding new hex only where nothing fits).
 */
export const HIDDEN_CHIP_FG = { light: '#BDC7C1', dark: 'rgba(126,149,138,0.55)' };
