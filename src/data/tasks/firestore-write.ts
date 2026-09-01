/**
 * Live `tasks` writers — same collection the reference ERP uses.
 *
 * The mobile `Task` is a thin slice of the live doc; on create we fill the live
 * shape, on update we patch only what the mobile edit can change. `due` is a
 * 3-way bucket on mobile, so `dueDate` is reconstructed to a concrete date.
 */

import { doc, getDoc } from '@/lib/supabase/firestore-compat';

import { getDb } from '@/lib/supabase/firestore-compat';
import { createDocument, patchDocument, removeDocument } from '@/lib/supabase/write';
import { getActor } from '@/data/notifications/actor';

import type { Task, TaskStatus } from './types';

const COLLECTION = 'tasks';

const STATUS_TO_LIVE: Record<TaskStatus, string> = {
  blocked: 'Blocked',
  progress: 'In Progress',
  inactive: 'To Do',
  done: 'Done',
};

function dueDateFor(due: Task['due']): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  if (due === 'tomorrow') d.setDate(d.getDate() + 1);
  if (due === 'week') d.setDate(d.getDate() + 5);
  return d.toISOString().slice(0, 10);
}

/**
 * Only the fields the mobile edit owns. `orderRef` is deliberately absent: the
 * mobile task has no reference field any more, and patching it would wipe one
 * set on the web.
 */
function toLive(task: Task) {
  return {
    title: task.title,
    status: STATUS_TO_LIVE[task.status],
    assignee: task.assignee,
    dueDate: dueDateFor(task.due),
  };
}

/** Upsert — patches when the doc id already exists in Firestore, else creates. */
export async function saveTask(task: Task): Promise<void> {
  let exists = false;
  try {
    exists = (await getDoc(doc(getDb(), COLLECTION, task.id))).exists();
  } catch {
    exists = false;
  }
  if (exists) {
    await patchDocument(COLLECTION, task.id, toLive(task));
  } else {
    await createDocument(COLLECTION, {
      ...toLive(task),
      description: '',
      category: '',
      orderRef: '',
      createdBy: getActor()?.name ?? 'kazi-mobile',
    });
  }
}

export async function deleteTask(id: string): Promise<void> {
  await removeDocument(COLLECTION, id);
}

/** Undo-after-delete — re-creates the row (a fresh doc id). */
export async function restoreTask(task: Task, _index: number): Promise<void> {
  await createDocument(COLLECTION, {
    ...toLive(task),
    description: '',
    category: '',
    orderRef: '',
    createdBy: getActor()?.name ?? 'kazi-mobile',
  });
}
