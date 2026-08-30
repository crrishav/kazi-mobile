/**
 * Data-source selector for the customers module.
 *   reads  → Firestore when configured (mock fallback on error)
 *   writes → Firestore when configured, mirrored into the mock (see `liveWrite`)
 *
 * Writes hit the reference ERP's own `customers` collection. `restoreCustomers`
 * (snapshot undo) is not reversed server-side — see `firestore-write.ts`.
 */

import { isFirebaseConfigured } from '@/lib/firebase';
import { withMockFallback } from '@/lib/firestore/read';
import { liveWrite } from '@/lib/firestore/write';

import * as live from './firestore';
import * as writeLive from './firestore-write';
import * as mock from './mock-api';

export const fetchCustomers = isFirebaseConfigured
  ? withMockFallback('customers', live.fetchCustomers, mock.fetchCustomers)
  : mock.fetchCustomers;

export const addCustomer = liveWrite('customers/addCustomer', writeLive.addCustomer, mock.addCustomer);
export const updateCustomer = liveWrite('customers/updateCustomer', writeLive.updateCustomer, mock.updateCustomer);
export const deleteCustomer = liveWrite('customers/deleteCustomer', writeLive.deleteCustomer, mock.deleteCustomer);
export const restoreCustomers = liveWrite('customers/restoreCustomers', writeLive.restoreCustomers, mock.restoreCustomers);
