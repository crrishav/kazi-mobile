/**
 * Data-source selector for the marketing module.
 *   reads  → Firestore when configured (mock fallback on error)
 *   writes → Firestore when configured, mirrored into the mock (see `liveWrite`)
 *
 * Writes hit the reference ERP's own `content_calendar` collection.
 */

import { isFirebaseConfigured } from '@/lib/firebase';
import { withMockFallback } from '@/lib/firestore/read';
import { liveWrite } from '@/lib/firestore/write';

import * as live from './firestore';
import * as writeLive from './firestore-write';
import * as mock from './mock-api';

export const fetchEntries = isFirebaseConfigured
  ? withMockFallback('marketing', live.fetchEntries, mock.fetchEntries)
  : mock.fetchEntries;

export const addEntry = liveWrite('marketing/addEntry', writeLive.addEntry, mock.addEntry);
export const updateEntry = liveWrite('marketing/updateEntry', writeLive.updateEntry, mock.updateEntry);
export const removeEntry = liveWrite('marketing/removeEntry', writeLive.removeEntry, mock.removeEntry);
export const restoreEntry = liveWrite('marketing/restoreEntry', writeLive.restoreEntry, mock.restoreEntry);
