/**
 * Live `orders` writers — the reference ERP's own collection, shared by Sales
 * (read-only) and Order Management.
 *
 * The mobile 5-stage chain maps onto reference stage names the reader recognises
 * by keyword. `stageHistory` is not appended on a move — the reader back-fills a
 * full history from the current stage, so patching `stage` alone is enough.
 */

import { arrayUnion } from 'firebase/firestore';

import { createDocument, patchDocument, removeDocument } from '@/lib/firestore/write';
import { getActor } from '@/data/notifications/actor';

import type { Order, OrderNote, OrderPriority, StageId } from './types';

const COLLECTION = 'orders';

// Exact `stage_config` doc names in the live project (sampled 2026-08) — the
// website matches orders to stages by this string, so it must be verbatim.
const STAGE_TO_LIVE: Record<StageId, string> = {
  sourcing: 'Fabric Sourcing',
  cutting: 'Cutting',
  finishing: 'Stitching',
  packing: 'Packing',
  delivered: 'Delivered',
};

function toLive(o: Partial<Order>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (o.ref !== undefined) out.orderId = o.ref;
  if (o.customer !== undefined) out.customerName = o.customer;
  if (o.product !== undefined) out.styleName = o.product;
  if (o.qty !== undefined) out.quantity = o.qty;
  if (o.value !== undefined) out.totalValueNPR = o.value;
  if (o.stage !== undefined) out.stage = STAGE_TO_LIVE[o.stage];
  if (o.priority !== undefined) out.priority = o.priority === 'high' ? 'High' : 'Normal';
  if (o.status !== undefined) out.status = o.status === 'cancelled' ? 'Cancelled' : 'Active';
  if (o.assignedTo !== undefined) out.assignedTo = o.assignedTo;
  if (o.po !== undefined) out.invoiceRef = o.po;
  return out;
}

export async function addOrder(order: Order): Promise<void> {
  await createDocument(COLLECTION, {
    ...toLive(order),
    pricePerPcNPR: order.qty > 0 ? Math.round(order.value / order.qty) : 0,
    date: new Date().toISOString().slice(0, 10),
    deliveryDate: '',
    colorway: '',
    notes: '',
    notesList: order.notes ?? [],
    stageHistory: order.stageHistory ?? [],
    createdBy: getActor()?.name ?? 'kazi-mobile',
  });
}

export async function updateOrder(id: string, updates: Partial<Order>): Promise<void> {
  const fields = toLive(updates);
  if (Object.keys(fields).length > 0) await patchDocument(COLLECTION, id, fields);
}

export async function setOrderStage(id: string, stage: StageId): Promise<void> {
  const liveStage = STAGE_TO_LIVE[stage];
  await patchDocument(COLLECTION, id, {
    stage: liveStage,
    status: stage === 'delivered' ? 'Completed' : 'Active',
    stageHistory: arrayUnion({ stage: liveStage, at: new Date().toISOString(), by: getActor()?.name ?? 'kazi-mobile' }),
  });
}

export async function setOrderPriority(id: string, priority: OrderPriority): Promise<void> {
  await patchDocument(COLLECTION, id, { priority: priority === 'high' ? 'High' : 'Normal' });
}

export async function addOrderNote(id: string, note: OrderNote): Promise<void> {
  // Live docs carry the note list on `notesList` (array); `notes` is a scalar string.
  await patchDocument(COLLECTION, id, {
    notesList: arrayUnion({ id: note.id, body: note.body, at: note.at, who: note.who }),
  });
}

export async function setOrderStatus(id: string, status: Order['status']): Promise<void> {
  await patchDocument(COLLECTION, id, { status: status === 'cancelled' ? 'Cancelled' : 'Active' });
}

/** Snapshot restore (undo) — not reversed in Firestore this pass. */
export async function restoreOrders(_previous: Order[]): Promise<void> {
  /* intentionally no live write */
}
