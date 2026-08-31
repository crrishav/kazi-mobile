/**
 * Live `tasks` reader. Maps the reference ERP's `tasks` docs onto the mobile
 * `Task` shape, and reads the assignee picker's list from `employees`.
 *
 * Live shape (sampled 2026-08-31):
 *   tasks      { title, description, status: "To Do"|"In Progress"|"Blocked"|"Done",
 *                assignee: string (a plain display name, often ""), priority,
 *                dueDate: string (usually ""), customer, orderRef, notes,
 *                category, createdBy, createdAt }
 *   employees  { name, email, role, status: "Active"|… }
 *
 * `assignee` is carried through as the raw name — the reference stores a name,
 * not an id, so mapping it to a directory id and back would only lose data.
 * `dueDate` is mostly empty, so it buckets to today/tomorrow/week, default `week`.
 */

import { str } from '@/lib/firestore/normalise';
import { readCollection, type DocData } from '@/lib/firestore/read';

import { assigneeFromName } from './mock';
import type { Assignee, DueOptionId, Task, TaskStatus } from './types';

const STATUS_MAP: Record<string, TaskStatus> = {
  'to do': 'inactive',
  todo: 'inactive',
  'in progress': 'progress',
  progress: 'progress',
  blocked: 'blocked',
  'on hold': 'blocked',
  done: 'done',
  complete: 'done',
  completed: 'done',
};

function mapStatus(raw: unknown): TaskStatus {
  return STATUS_MAP[str(raw).trim().toLowerCase()] ?? 'inactive';
}

/** Bucket an AD date string into the mobile due options; unparseable → `week`. */
function mapDue(raw: unknown): DueOptionId {
  const s = str(raw).trim();
  if (!s) return 'week';
  const when = new Date(s);
  if (Number.isNaN(when.getTime())) return 'week';
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const days = Math.round((when.getTime() - startOfToday.getTime()) / 86_400_000);
  if (days <= 0) return 'today';
  if (days === 1) return 'tomorrow';
  return 'week';
}

function mapTaskDoc(id: string, d: DocData): Task | null {
  const title = str(d.title).trim();
  if (!title) return null;
  return {
    id,
    title,
    due: mapDue(d.dueDate),
    status: mapStatus(d.status),
    assignee: str(d.assignee).trim(),
  };
}

export async function fetchTasks(): Promise<Task[]> {
  return readCollection('tasks', mapTaskDoc);
}

/**
 * Who a task can be assigned to: the live Employee Directory, active staff only,
 * sorted by name. A staffer with no name is skipped — `tasks.assignee` is the
 * name, so a blank one would be indistinguishable from unassigned.
 */
export async function fetchAssignees(): Promise<Assignee[]> {
  const rows = await readCollection<Assignee>('employees', (id, d) => {
    const name = str(d.name).trim();
    if (!name) return null;
    const status = str(d.status).trim().toLowerCase();
    if (status && status !== 'active') return null;
    return assigneeFromName(name, id, str(d.role).trim());
  });
  return rows.sort((a, b) => a.name.localeCompare(b.name));
}
