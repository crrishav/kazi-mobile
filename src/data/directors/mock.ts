/**
 * Seed role register, used only when Supabase is unconfigured (local dev with
 * no `.env`). Shaped like the live tables — a handful of positions, their
 * section grants, and invented staff — so the screen has something to draw.
 */

import type { RoleDirectory, RoleHolder, RoleSection } from './types';
import { makeHolder, sortRoles } from './utils';

function holder(id: string, name: string, email: string, location: 'nepal' | 'uk', department: string): RoleHolder {
  return makeHolder({ id, name, email, location, department, active: true });
}

function sections(...pairs: [string, string, boolean][]): RoleSection[] {
  return pairs.map(([id, label, canEdit]) => ({ id, label, canEdit }));
}

const CORE: RoleSection[] = sections(
  ['dashboard', 'Dashboard', false],
  ['tasks', 'Tasks', true],
  ['attendance', 'Attendance', false],
  ['messenger', 'Messenger', false],
);

export const ROLE_DIRECTORY: RoleDirectory = {
  roles: sortRoles([
    {
      id: 'system-admin',
      label: 'System Admin',
      description: 'Full system access.',
      holders: [holder('m1', 'Admin', 'admin@kazi.com', 'nepal', 'Operations')],
      sections: [...CORE, ...sections(['admin', 'Admin Panel', true], ['finance', 'Finance', true], ['employees', 'Employees & HR', true])],
    },
    {
      id: 'director',
      label: 'Director',
      description: 'UK director. Oversight across the business, light editing.',
      holders: [
        holder('m2', 'Ada Vale', 'ada@example.com', 'uk', 'Operations'),
        holder('m3', 'Ren Hollis', 'ren@example.com', 'uk', 'Operations'),
      ],
      sections: [...CORE, ...sections(['orders', 'Orders', false], ['finance', 'Finance', false], ['employees', 'Employees & HR', true], ['directors', 'Directors', true])],
    },
    {
      id: 'operations-head',
      label: 'Operations Head',
      description: 'Day-to-day owner of production, inventory and staff.',
      holders: [holder('m4', 'Jun Park', 'jun@example.com', 'nepal', 'Management')],
      sections: [...CORE, ...sections(['production', 'Production', true], ['inventory', 'Inventory', true], ['orders', 'Orders', true], ['employees', 'Employees & HR', true])],
    },
    {
      id: 'accountant',
      label: 'Accountant',
      description: 'Finance, accounting, billing, payroll and inventory.',
      holders: [holder('m5', 'Sona Rai', 'sona@example.com', 'nepal', 'Finance')],
      sections: [...CORE, ...sections(['billing', 'Billing', true], ['finance', 'Finance', true], ['accounting', 'Accounting', true], ['purchases', 'Purchases', true])],
    },
    {
      id: 'fashion-designer',
      label: 'Fashion Designer',
      description: 'The product library, specs and sampling.',
      holders: [holder('m6', 'Mira Osei', 'mira@example.com', 'nepal', 'Design')],
      sections: [...CORE, ...sections(['library', 'Product Library', true], ['production', 'Production', false], ['quality_control', 'Quality Control', false])],
    },
    {
      id: 'labour',
      label: 'Labour',
      description: 'Cutter/stitcher. Own attendance and assigned tasks.',
      holders: [],
      sections: CORE,
    },
  ]),
  unassigned: [holder('m7', 'Tem Gurung', 'tem@example.com', 'nepal', '')],
};
