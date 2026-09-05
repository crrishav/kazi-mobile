import type { ComponentProps } from 'react';
import type { Feather } from '@expo/vector-icons';

type FeatherIconName = ComponentProps<typeof Feather>['name'];

export interface ModuleEntry {
  id: string;
  label: string;
  route: string;
  icon: FeatherIconName;
  /** One-line description shown on the More hub card. */
  blurb: string;
}

// Every module that is not a permanent tab for everyone. Chat is deliberately
// absent: it is the centre button on every layout, so a More card for it would
// be a second door to the same room. The rest are reached from the More hub or
// from a dashboard quick link.
export const MORE_MODULES: ModuleEntry[] = [
  { id: 'sales', label: 'Sales', route: '/sales', icon: 'trending-up', blurb: 'Pipeline overview' },
  { id: 'order-management', label: 'Production', route: '/order-management', icon: 'tool', blurb: 'Order pipeline, stages, priority' },
  { id: 'customers', label: 'Customers', route: '/customers', icon: 'users', blurb: 'Accounts and contacts' },
  { id: 'billing', label: 'Billing', route: '/billing', icon: 'file-text', blurb: 'Invoices, challans, payments' },
  { id: 'purchases', label: 'Purchases', route: '/purchases', icon: 'shopping-cart', blurb: 'Purchase orders, suppliers' },
  { id: 'quality-control', label: 'Quality Control', route: '/quality-control', icon: 'check-circle', blurb: 'Batch inspections' },
  { id: 'accounting', label: 'Accounting', route: '/accounting', icon: 'book-open', blurb: 'Journal entries, VAT' },
  { id: 'budget-requirements', label: 'Budget & Requirements', route: '/budget-requirements', icon: 'briefcase', blurb: 'Requests and approvals' },
  { id: 'employees-hr', label: 'Employees & HR', route: '/employees-hr', icon: 'clipboard', blurb: 'Staff registry, roles' },
  { id: 'attendance', label: 'Attendance', route: '/attendance', icon: 'clock', blurb: 'Daily shift records' },
  { id: 'marketing', label: 'Marketing', route: '/marketing', icon: 'send', blurb: 'Campaigns and leads' },
  { id: 'directors', label: 'Roles', route: '/directors', icon: 'award', blurb: 'Every role, and who holds it' },
  { id: 'admin-panel', label: 'Admin Panel', route: '/admin-panel', icon: 'shield', blurb: 'Access and roles' },
  { id: 'changelog', label: 'Changelog', route: '/changelog', icon: 'list', blurb: "What's new" },
  { id: 'bug-report', label: 'Bug Report', route: '/bug-report', icon: 'alert-triangle', blurb: 'Log an issue you hit' },
];

export const MODULES_BY_ID: Record<string, ModuleEntry> = Object.fromEntries(
  MORE_MODULES.map((m) => [m.id, m]),
);
