import type { DueOptionId, Person, Task, TaskStatus } from './types';

// Blocked sorts first, then In progress, Inactive, Done — the order staff
// actually triage in, not alphabetical (style guide's own rule for this screen).
export const STATUS_ORDER: TaskStatus[] = ['blocked', 'progress', 'inactive', 'done'];

export const STATUS_LABEL: Record<TaskStatus, string> = {
  blocked: 'Blocked',
  progress: 'In progress',
  inactive: 'Inactive',
  done: 'Done',
};

export const PEOPLE: Person[] = [
  { id: 'sr', initials: 'SR', name: 'Sita', tint: 'dark' },
  { id: 'ak', initials: 'AK', name: 'Anil', tint: 'mint' },
  { id: 'pt', initials: 'PT', name: 'Pramila', tint: 'clay' },
  { id: 'rb', initials: 'RB', name: 'Rabin', tint: 'draft' },
  { id: 'mk', initials: 'MK', name: 'Manisha', tint: 'amber' },
];

export const DUE_OPTIONS: { id: DueOptionId; label: string; note: string }[] = [
  { id: 'today', label: 'Today', note: '26 Aug · Tue' },
  { id: 'tomorrow', label: 'Tomorrow', note: '27 Aug · Wed' },
  { id: 'week', label: 'This week', note: '29 Aug · Fri' },
];

export const seedTasks: Task[] = [
  { id: 't1', title: 'Sample approval — hoodie hood lining', ref: 'PO-2291', due: 'today', status: 'progress', personId: 'sr' },
  { id: 't2', title: 'Chase fabric ETA from Everest Mills', ref: 'PO-2288', due: 'today', status: 'blocked', personId: 'ak' },
  { id: 't3', title: 'Re-check needle inspection log', ref: 'QC-114', due: 'tomorrow', status: 'progress', personId: 'pt' },
  { id: 't4', title: 'Set up cutting table for chino run', ref: 'PO-2284', due: 'today', status: 'progress', personId: 'rb' },
  { id: 't5', title: 'Trims count for packing line', ref: 'INV-0092', due: 'week', status: 'inactive', personId: 'mk' },
  { id: 't6', title: 'Shift handover notes to night lead', ref: 'OPS-31', due: 'today', status: 'done', personId: 'sr' },
  { id: 't7', title: 'Photograph AQL defects for buyer', ref: 'QC-113', due: 'week', status: 'blocked', personId: 'pt' },
];
