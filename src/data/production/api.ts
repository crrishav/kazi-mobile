/**
 * Data-source selector for the production module.
 *   reads  → Firestore when configured (mock fallback on error)
 *   writes → Firestore when configured, mirrored into the mock (see `liveWrite`)
 *
 * Writes hit the reference ERP's own `production` collection. Only count-bearing
 * edits round-trip (see `firestore-write.ts`); stage moves stay local.
 */

import { isFirebaseConfigured } from '@/lib/firebase';
import { withMockFallback } from '@/lib/firestore/read';
import { liveWrite } from '@/lib/firestore/write';

import * as live from './firestore';
import * as writeLive from './firestore-write';
import * as mock from './mock-api';

export const fetchBatches = isFirebaseConfigured
  ? withMockFallback('production', live.fetchBatches, mock.fetchBatches)
  : mock.fetchBatches;

export const addBatch = liveWrite('production/addBatch', writeLive.addBatch, mock.addBatch);
export const updateBatch = liveWrite('production/updateBatch', writeLive.updateBatch, mock.updateBatch);
