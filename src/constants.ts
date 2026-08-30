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

// The 4 real tabs (Dashboard/Tasks/Inventory/Finance) use their own hand-ported
// icons (see components/ui/icon/nav-icons.tsx) — this registry is the other 15
// modules, reached via the More hub and pushed onto the (app) stack.
export const MORE_MODULES: ModuleEntry[] = [
  { id: 'sales', label: 'Sales', route: '/sales', icon: 'trending-up', blurb: 'Pipeline overview' },
  { id: 'order-management', label: 'Order Management', route: '/order-management', icon: 'grid', blurb: 'Order board, stages, priority' },
  { id: 'customers', label: 'Customers', route: '/customers', icon: 'users', blurb: 'Accounts and contacts' },
  { id: 'billing', label: 'Billing', route: '/billing', icon: 'file-text', blurb: 'Invoices, challans, payments' },
  { id: 'purchases', label: 'Purchases', route: '/purchases', icon: 'shopping-cart', blurb: 'Purchase orders, suppliers' },
  { id: 'production', label: 'Production', route: '/production', icon: 'tool', blurb: 'Job orders, batches, output' },
  { id: 'quality-control', label: 'Quality Control', route: '/quality-control', icon: 'check-circle', blurb: 'Batch inspections' },
  { id: 'accounting', label: 'Accounting', route: '/accounting', icon: 'book-open', blurb: 'Journal entries, VAT' },
  { id: 'budget-requirements', label: 'Budget & Requirements', route: '/budget-requirements', icon: 'briefcase', blurb: 'Requests and approvals' },
  { id: 'employees-hr', label: 'Employees & HR', route: '/employees-hr', icon: 'clipboard', blurb: 'Staff registry, roles' },
  { id: 'attendance', label: 'Attendance', route: '/attendance', icon: 'clock', blurb: 'Daily shift records' },
  { id: 'marketing', label: 'Marketing', route: '/marketing', icon: 'send', blurb: 'Campaigns and leads' },
  { id: 'messenger', label: 'Messenger', route: '/messenger', icon: 'message-circle', blurb: 'Team messaging' },
  { id: 'directors', label: 'Directors', route: '/directors', icon: 'award', blurb: 'Executive summary' },
  { id: 'admin-panel', label: 'Admin Panel', route: '/admin-panel', icon: 'shield', blurb: 'Access and roles' },
  { id: 'changelog', label: 'Changelog', route: '/changelog', icon: 'list', blurb: "What's new" },
  { id: 'bug-report', label: 'Bug Report', route: '/bug-report', icon: 'alert-triangle', blurb: 'Log an issue you hit' },
];

export const MODULES_BY_ID: Record<string, ModuleEntry> = Object.fromEntries(
  MORE_MODULES.map((m) => [m.id, m]),
);
