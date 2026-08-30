/**
 * Live `tasks` reader (Track B, read-only). Maps the reference ERP's `tasks`
 * docs onto the mobile `Task` shape. Writes still go through `mock-api.ts`.
 *
 * Live shape (sampled 2026-08-30):
 *   { title, description, status: "To Do"|"In Progress"|"Blocked"|"Done",
 *     assignee: string, priority: "low"|"med"|"high", dueDate: string,
 *     customer, orderRef, notes, category, createdBy, createdAt }
 *
 * Gaps handled locally (see plan §Batch 1):
 *   - no `ref` field         → `TASK-<id slice>`
 *   - `dueDate` mostly ""    → bucketed to today/tomorrow/week, default `week`
 *   - `assignee` free string → first-name match to `PEOPLE`, else stable hash
 */

import { str } from '@/lib/firestore/normalise';
import { readCollection, type DocData } from '@/lib/firestore/read';

import { PEOPLE } from './mock';
import type { DueOptionId, Task, TaskStatus } from './types';

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

function hashToPerson(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i += 1) h = (h * 31 + name.charCodeAt(i)) | 0;
  return PEOPLE[Math.abs(h) % PEOPLE.length].id;
}

/** Live `assignee` name → a `PEOPLE` id (first-name match, else stable hash, else PEOPLE[0]). */
function mapAssignee(raw: unknown): string {
  const name = str(raw).trim();
  if (!name) return PEOPLE[0].id;
  const first = name.split(/\s+/)[0].toLowerCase();
  const hit = PEOPLE.find((p) => p.name.toLowerCase() === first || p.name.toLowerCase() === name.toLowerCase());
  return hit ? hit.id : hashToPerson(name);
}

function mapTaskDoc(id: string, d: DocData): Task | null {
  const title = str(d.title).trim();
  if (!title) return null;
  const liveRef = str(d.orderRef).trim();
  return {
    id,
    title,
    ref: liveRef || `TASK-${id.slice(0, 4).toUpperCase()}`,
    due: mapDue(d.dueDate),
    status: mapStatus(d.status),
    personId: mapAssignee(d.assignee),
  };
}

export async function fetchTasks(): Promise<Task[]> {
  return readCollection('tasks', mapTaskDoc);
}
