import type { AvatarTint } from '@/components/ui/avatar';

export type TaskStatus = 'blocked' | 'progress' | 'inactive' | 'done';
export type DueOptionId = 'today' | 'tomorrow' | 'week';

/**
 * Someone a task can be assigned to — one row of the live `employees`
 * directory. Tasks store the **name**, not this id: the reference ERP's
 * `tasks.assignee` is a plain name string, and matching it to a directory id is
 * unreliable (see the identity notes in `data/attendance/live-shared.ts`).
 */
export interface Assignee {
  /** `employees` doc id — list key only. */
  id: string;
  name: string;
  initials: string;
  tint: AvatarTint;
  role: string;
}

export interface Task {
  id: string;
  title: string;
  due: DueOptionId;
  status: TaskStatus;
  /** Display name of the person it's on, `''` when nobody's picked it up. */
  assignee: string;
}
