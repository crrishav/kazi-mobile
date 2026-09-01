/**
 * Live inventory writers — match the reference web app's model:
 *   - `inventory` doc holds a FIXED `openingStock` (opening balance); it is never
 *     touched by a movement.
 *   - running quantity = `openingStock + Σ(stock_movements)` — so every stock
 *     movement is a new `stock_movements` doc (`{ itemId, date, qty, direction,
 *     source, note, amountNPR, createdBy, createdAt }`), exactly like
 *     `utils/stockLedger.logStockMovement` in the website.
 *
 * The Library (`fabrics`/`processes`/`patterns`) is read-only in this app.
 * The mobile Inventory reader shows `qty = openingStock` and has no live
 * movements feed, so a posted movement persists to Firestore (and the website
 * ledger) but the mobile list won't reflect the delta until that reader sums
 * `stock_movements` too.
 */

import { collection, doc, getDoc, getDocs, query, where } from '@/lib/supabase/firestore-compat';

import { getDb } from '@/lib/supabase/firestore-compat';
import { num } from '@/lib/firestore/normalise';
import { createDocument, patchDocument } from '@/lib/supabase/write';
import { getActor } from '@/data/notifications/actor';

import type { StockItem, StockMoveKind } from './types';

const INVENTORY = 'inventory';
const MOVEMENTS = 'stock_movements';

function costNumber(cost: string | undefined): number | undefined {
  if (cost === undefined) return undefined;
  const n = parseFloat(cost.replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

/** Editable `inventory` fields (excludes `openingStock` — that only lands at create). */
function detailFields(s: Partial<StockItem>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (s.name !== undefined) out.item = s.name;
  if (s.sku !== undefined) out.itemId = s.sku;
  if (s.supplier !== undefined) out.supplier = s.supplier;
  if (s.unit !== undefined) out.unit = s.unit;
  if (s.location !== undefined) out.location = s.location;
  if (s.threshold !== undefined) out.minLevel = s.threshold;
  const cost = costNumber(s.cost);
  if (cost !== undefined) out.unitCostNPR = cost;
  return out;
}

export async function addStockItem(item: StockItem): Promise<void> {
  await createDocument(INVENTORY, {
    ...detailFields(item),
    openingStock: item.qty, // opening balance at creation only
    category: '',
    createdBy: getActor()?.name ?? 'kazi-mobile',
  });
}

export async function updateStockItem(id: string, updates: Partial<StockItem>): Promise<void> {
  const fields = detailFields(updates);
  if (Object.keys(fields).length > 0) await patchDocument(INVENTORY, id, fields);
}

/** Sum an item's existing movements so an absolute "adjust" can be posted as a delta. */
async function runningQty(itemDocId: string): Promise<number> {
  let opening = 0;
  let net = 0;
  try {
    const invDoc = await getDoc(doc(getDb(), INVENTORY, itemDocId));
    opening = num((invDoc.data() as Record<string, unknown> | undefined)?.openingStock);
  } catch {
    opening = 0;
  }
  const movSnap = await getDocs(query(collection(getDb(), MOVEMENTS), where('itemId', '==', itemDocId)));
  movSnap.docs.forEach((d) => {
    const m = d.data() as Record<string, unknown>;
    net += (String(m.direction) === 'in' ? 1 : -1) * num(m.qty);
  });
  return opening + net;
}

async function logMovement(itemId: string, qty: number, direction: 'in' | 'out', note: string, source = 'manual') {
  await createDocument(MOVEMENTS, {
    itemId,
    date: new Date().toISOString().slice(0, 10),
    qty: Math.abs(qty),
    direction,
    source,
    sourceId: null,
    note,
    amountNPR: 0,
    createdBy: getActor()?.name ?? 'kazi-mobile',
  });
}

export async function postStockMovement(input: {
  itemId: string;
  kind: StockMoveKind;
  qty: number;
  reason: string;
  ref: string;
}): Promise<void> {
  if (input.kind === 'in') {
    await logMovement(input.itemId, input.qty, 'in', input.reason || 'Stock in');
  } else if (input.kind === 'out') {
    await logMovement(input.itemId, input.qty, 'out', input.reason || 'Stock out');
  } else {
    // absolute count → post the compensating movement to reach it
    const current = await runningQty(input.itemId);
    const delta = input.qty - current;
    if (delta !== 0) {
      await logMovement(input.itemId, delta, delta > 0 ? 'in' : 'out', input.reason || 'Count adjustment');
    }
  }
}

export async function restoreInventory(): Promise<void> {
  /* snapshot undo — not reversed in Firestore this pass */
}

export async function adjustStockByName(name: string, delta: number): Promise<void> {
  const snap = await getDocs(query(collection(getDb(), INVENTORY), where('item', '==', name.trim())));
  const target = snap.docs[0];
  if (!target) return;
  await logMovement(
    target.id,
    delta,
    delta >= 0 ? 'in' : 'out',
    delta >= 0 ? 'Auto stock-in · purchase' : 'Auto stock-out',
    'purchase',
  );
}
