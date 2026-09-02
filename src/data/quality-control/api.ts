/**
 * Data-source selector for the quality-control module.
 *   reads  → `fetchQcLogs` from Supabase when configured (a failed read throws; no mock fallback)
 *   writes → `addQcLog` to Supabase when configured, mirrored into the mock
 *
 * `fetchQueue` + queue mutations stay mock-only — the QC queue is a derivation
 * off `production` with no live collection.
 */

import { isSupabaseConfigured } from '@/lib/supabase';
import { liveRead } from '@/lib/supabase/read';
import { liveWrite } from '@/lib/supabase/write';

import * as live from './firestore';
import * as writeLive from './firestore-write';
import * as mock from './mock-api';

export { fetchQueue, removeFromQueue, restoreToQueue } from './mock-api';

export const fetchQcLogs = isSupabaseConfigured
  ? liveRead('quality-control/logs', live.fetchQcLogs)
  : mock.fetchQcLogs;

export const addQcLog = liveWrite('quality-control/addQcLog', writeLive.addQcLog, mock.addQcLog);
export const restoreQcLogs = liveWrite('quality-control/restoreQcLogs', writeLive.restoreQcLogs, mock.restoreQcLogs);
