/**
 * Data-source selector for the quality-control module.
 *   reads  → `fetchQcLogs` from Firestore when configured (mock fallback on error)
 *   writes → `addQcLog` to Firestore when configured, mirrored into the mock
 *
 * `fetchQueue` + queue mutations stay mock-only — the QC queue is a derivation
 * off `production` with no live collection.
 */

import { isSupabaseConfigured } from '@/lib/supabase';
import { withMockFallback } from '@/lib/supabase/read';
import { liveWrite } from '@/lib/supabase/write';

import * as live from './firestore';
import * as writeLive from './firestore-write';
import * as mock from './mock-api';

export { fetchQueue, removeFromQueue, restoreToQueue } from './mock-api';

export const fetchQcLogs = isSupabaseConfigured
  ? withMockFallback('quality-control/logs', live.fetchQcLogs, mock.fetchQcLogs)
  : mock.fetchQcLogs;

export const addQcLog = liveWrite('quality-control/addQcLog', writeLive.addQcLog, mock.addQcLog);
export const restoreQcLogs = liveWrite('quality-control/restoreQcLogs', writeLive.restoreQcLogs, mock.restoreQcLogs);
