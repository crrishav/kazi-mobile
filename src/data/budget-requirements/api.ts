/**
 * Data-source selector for the budget & requirements module.
 *   reads  → Firestore when configured (mock fallback on error)
 *   writes → Firestore when configured, mirrored into the mock (see `liveWrite`)
 *
 * Both tabs read/write the reference ERP's own `budget_requests` collection
 * (`type` discriminates). Snapshot-undo restores are not reversed server-side.
 */

import { isFirebaseConfigured } from '@/lib/firebase';
import { withMockFallback } from '@/lib/firestore/read';
import { liveWrite } from '@/lib/firestore/write';

import * as live from './firestore';
import * as writeLive from './firestore-write';
import * as mock from './mock-api';

export const fetchRequirements = isFirebaseConfigured
  ? withMockFallback('budget-requirements/req', live.fetchRequirements, mock.fetchRequirements)
  : mock.fetchRequirements;

export const fetchBudgetRequests = isFirebaseConfigured
  ? withMockFallback('budget-requirements/budget', live.fetchBudgetRequests, mock.fetchBudgetRequests)
  : mock.fetchBudgetRequests;

export const addRequirement = liveWrite('budget-requirements/addRequirement', writeLive.addRequirement, mock.addRequirement);
export const updateRequirement = liveWrite('budget-requirements/updateRequirement', writeLive.updateRequirement, mock.updateRequirement);
export const restoreRequirements = liveWrite('budget-requirements/restoreRequirements', writeLive.restoreRequirements, mock.restoreRequirements);

export const addBudgetRequest = liveWrite('budget-requirements/addBudgetRequest', writeLive.addBudgetRequest, mock.addBudgetRequest);
export const updateBudgetRequest = liveWrite('budget-requirements/updateBudgetRequest', writeLive.updateBudgetRequest, mock.updateBudgetRequest);
export const restoreBudgetRequests = liveWrite('budget-requirements/restoreBudgetRequests', writeLive.restoreBudgetRequests, mock.restoreBudgetRequests);
