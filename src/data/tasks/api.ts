/**
 * Data-source selector for the tasks module.
 *   reads  → Firestore when configured (mock fallback on error)
 *   writes → Firestore when configured, mirrored into the mock (see `liveWrite`)
 *
 * Live writes hit the reference ERP's own `tasks` collection. The optimistic
 * cache reconciles with the server on the next refetch (stale after 60s /
 * on remount) — no per-mutation invalidation is wired this pass.
 */

import { isSupabaseConfigured } from '@/lib/supabase';
import { withMockFallback } from '@/lib/supabase/read';
import { liveWrite } from '@/lib/supabase/write';

import * as live from './firestore';
import * as writeLive from './firestore-write';
import * as mock from './mock-api';

export const fetchTasks = isSupabaseConfigured
  ? withMockFallback('tasks', live.fetchTasks, mock.fetchTasks)
  : mock.fetchTasks;

// The assignee picker is the live Employee Directory — falling back to the
// mock roster is fine, it just means a denied read shows stand-in names.
export const fetchAssignees = isSupabaseConfigured
  ? withMockFallback('tasks/assignees', live.fetchAssignees, mock.fetchAssignees)
  : mock.fetchAssignees;

export const saveTask = liveWrite('tasks/saveTask', writeLive.saveTask, mock.saveTask);
export const deleteTask = liveWrite('tasks/deleteTask', writeLive.deleteTask, mock.deleteTask);
export const restoreTask = liveWrite('tasks/restoreTask', writeLive.restoreTask, mock.restoreTask);
