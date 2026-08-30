/**
 * Data-source selector for the inventory module.
 *   reads  → Firestore when configured (mock fallback on error)
 *   writes → Firestore when configured, mirrored into the mock (see `liveWrite`)
 *
 * Writes hit the reference ERP's own `inventory` collection. There is no live
 * movements ledger — stock movements patch `openingStock` to the new level and
 * the ledger rows stay mock-only. Snapshot-undo restore is not reversed
 * server-side.
 */

import { isFirebaseConfigured } from '@/lib/firebase';
import { withMockFallback } from '@/lib/firestore/read';
import { liveWrite } from '@/lib/firestore/write';

import * as live from './firestore';
import * as writeLive from './firestore-write';
import * as mock from './mock-api';
import type { StockItem, StockMoveKind, StockMovement } from './types';

export const fetchStock = isFirebaseConfigured
  ? withMockFallback('inventory/stock', live.fetchStock, mock.fetchStock)
  : mock.fetchStock;

export const fetchLibrary = isFirebaseConfigured
  ? withMockFallback('inventory/library', live.fetchLibrary, mock.fetchLibrary)
  : mock.fetchLibrary;

export const fetchMovements = isFirebaseConfigured
  ? withMockFallback('inventory/movements', live.fetchMovements, mock.fetchMovements)
  : mock.fetchMovements;

export const addStockItem = liveWrite('inventory/addStockItem', writeLive.addStockItem, mock.addStockItem);
export const updateStockItem = liveWrite('inventory/updateStockItem', writeLive.updateStockItem, mock.updateStockItem);

export const postStockMovement = liveWrite(
  'inventory/postStockMovement',
  (input: { itemId: string; kind: StockMoveKind; qty: number; reason: string; ref: string }) =>
    writeLive.postStockMovement(input),
  mock.postStockMovement,
);

export const restoreInventory = liveWrite(
  'inventory/restoreInventory',
  (_prevStock: StockItem[], _prevMovements: StockMovement[]) => writeLive.restoreInventory(),
  mock.restoreInventory,
);

export const adjustStockByName = liveWrite(
  'inventory/adjustStockByName',
  (name: string, delta: number) => writeLive.adjustStockByName(name, delta),
  mock.adjustStockByName,
);
