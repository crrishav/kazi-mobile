/**
 * Data-source selector for the sales/orders module.
 *   reads  → Firestore when configured (mock fallback on error)
 *   writes → Firestore when configured, mirrored into the mock (see `liveWrite`)
 *
 * Writes hit the reference ERP's own `orders` collection. `restoreOrders`
 * (snapshot undo) is not reversed server-side.
 */

import { isFirebaseConfigured } from '@/lib/firebase';
import { withMockFallback } from '@/lib/firestore/read';
import { liveWrite } from '@/lib/firestore/write';

import * as live from './firestore';
import * as writeLive from './firestore-write';
import * as mock from './mock-api';

export const fetchOrders = isFirebaseConfigured
  ? withMockFallback('sales', live.fetchOrders, mock.fetchOrders)
  : mock.fetchOrders;

export const addOrder = liveWrite('sales/addOrder', writeLive.addOrder, mock.addOrder);
export const updateOrder = liveWrite('sales/updateOrder', writeLive.updateOrder, mock.updateOrder);
export const setOrderStage = liveWrite('sales/setOrderStage', writeLive.setOrderStage, mock.setOrderStage);
export const setOrderPriority = liveWrite('sales/setOrderPriority', writeLive.setOrderPriority, mock.setOrderPriority);
export const addOrderNote = liveWrite('sales/addOrderNote', writeLive.addOrderNote, mock.addOrderNote);
export const setOrderStatus = liveWrite('sales/setOrderStatus', writeLive.setOrderStatus, mock.setOrderStatus);
export const restoreOrders = liveWrite('sales/restoreOrders', writeLive.restoreOrders, mock.restoreOrders);
