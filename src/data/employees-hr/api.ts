/**
 * Data-source selector for the employees & HR module.
 *   reads  → Firestore when configured (mock fallback on error)
 *   writes → Firestore when configured, mirrored into the mock (see `liveWrite`)
 *
 * Writes hit the reference ERP's own `employees` collection. Payroll month
 * approvals have no live collection and stay mock-only. Snapshot-undo restore is
 * not reversed server-side.
 */

import { isSupabaseConfigured } from '@/lib/supabase';
import { withMockFallback } from '@/lib/supabase/read';
import { liveWrite } from '@/lib/supabase/write';

import * as live from './firestore';
import * as writeLive from './firestore-write';
import * as mock from './mock-api';

export { fetchApprovals, approveMonth } from './mock-api';

export const fetchEmployees = isSupabaseConfigured
  ? withMockFallback('employees-hr', live.fetchEmployees, mock.fetchEmployees)
  : mock.fetchEmployees;

export const addEmployee = liveWrite('employees-hr/addEmployee', writeLive.addEmployee, mock.addEmployee);
export const updateEmployee = liveWrite('employees-hr/updateEmployee', writeLive.updateEmployee, mock.updateEmployee);
export const deleteEmployee = liveWrite('employees-hr/deleteEmployee', writeLive.deleteEmployee, mock.deleteEmployee);
export const restoreEmployees = liveWrite('employees-hr/restoreEmployees', writeLive.restoreEmployees, mock.restoreEmployees);
