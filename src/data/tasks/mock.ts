import { tintFromSeed } from '@/components/ui/avatar';

import type { Assignee, DueOptionId, Task, TaskStatus } from './types';

// Blocked sorts first, then In progress, Inactive, Done — the order staff
// actually triage in, not alphabetical (style guide's own rule for this screen).
export const STATUS_ORDER: TaskStatus[] = ['blocked', 'progress', 'inactive', 'done'];

export const STATUS_LABEL: Record<TaskStatus, string> = {
  blocked: 'Blocked',
  progress: 'In progress',
  inactive: 'To do',
  done: 'Done',
};

/** Initials for an avatar: first letters of the first two words. */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '—';
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
}

/** Build the display half of an assignee from a bare name. */
export function assigneeFromName(name: string, id = name, role = ''): Assignee {
  return { id, name, initials: initialsOf(name), tint: tintFromSeed(name), role };
}

/** Stand-in directory for the mock data source; the live list comes from `employees`. */
export const MOCK_ASSIGNEES: Assignee[] = [
  assigneeFromName('Sita Rai', 'sr', 'Cutting'),
  assigneeFromName('Anil Karki', 'ak', 'Cutting'),
  assigneeFromName('Pramila Thapa', 'pt', 'Sewing'),
  assigneeFromName('Rabin Bhandari', 'rb', 'Finishing'),
  assigneeFromName('Manisha Gurung', 'mk', 'Packing'),
];

export const DUE_OPTIONS: { id: DueOptionId; label: string; note: string }[] = [
  { id: 'today', label: 'Today', note: '26 Aug · Tue' },
  { id: 'tomorrow', label: 'Tomorrow', note: '27 Aug · Wed' },
  { id: 'week', label: 'This week', note: '29 Aug · Fri' },
];

export const seedTasks: Task[] = [
  { id: 't1', title: 'Sample approval — hoodie hood lining', due: 'today', status: 'progress', assignee: 'Sita Rai' },
  { id: 't2', title: 'Chase fabric ETA from Everest Mills', due: 'today', status: 'blocked', assignee: 'Anil Karki' },
  { id: 't3', title: 'Re-check needle inspection log', due: 'tomorrow', status: 'progress', assignee: 'Pramila Thapa' },
  { id: 't4', title: 'Set up cutting table for chino run', due: 'today', status: 'progress', assignee: 'Rabin Bhandari' },
  { id: 't5', title: 'Trims count for packing line', due: 'week', status: 'inactive', assignee: 'Manisha Gurung' },
  { id: 't6', title: 'Shift handover notes to night lead', due: 'today', status: 'done', assignee: 'Sita Rai' },
  { id: 't7', title: 'Photograph AQL defects for buyer', due: 'week', status: 'blocked', assignee: '' },
];
