/**
 * Data-source selector for the production module.
 *   reads  → Supabase when configured (a failed read throws; no mock fallback)
 *   writes → Supabase when configured, mirrored into the mock (see `liveWrite`)
 *
 * Writes hit the reference ERP's own `production` collection. Only count-bearing
 * edits round-trip (see `firestore-write.ts`); stage moves stay local.
 */

import { isSupabaseConfigured } from '@/lib/supabase';
import { liveRead } from '@/lib/supabase/read';
import { liveWrite } from '@/lib/supabase/write';

import * as live from './firestore';
import * as writeLive from './firestore-write';
import * as mock from './mock-api';

export const fetchBatches = isSupabaseConfigured
  ? liveRead('production', live.fetchBatches)
  : mock.fetchBatches;

export const addBatch = liveWrite('production/addBatch', writeLive.addBatch, mock.addBatch);
export const updateBatch = liveWrite('production/updateBatch', writeLive.updateBatch, mock.updateBatch);
