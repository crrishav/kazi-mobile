import { simulateLatency } from '../mock/delay';
import { seedOrders } from './mock';
import type { Order, OrderNote, OrderPriority, StageId } from './types';

let db: Order[] = [...seedOrders];

export async function fetchOrders(): Promise<Order[]> {
  await simulateLatency();
  return [...db];
}

export async function addOrder(order: Order): Promise<void> {
  await simulateLatency(300);
  db = [order, ...db];
}

export async function updateOrder(id: string, updates: Partial<Order>): Promise<void> {
  await simulateLatency(250);
  db = db.map((o) => (o.id === id ? { ...o, ...updates } : o));
}

/** Move an order to `stage`, appending a `stageHistory` entry (the live `orders.stageHistory` write). */
export async function setOrderStage(id: string, stage: StageId): Promise<void> {
  await simulateLatency(200);
  db = db.map((o) =>
    o.id === id && o.stage !== stage
      ? {
          ...o,
          stage,
          status: 'active',
          stageHistory: [...o.stageHistory, { stage, at: new Date().toISOString() }],
        }
      : o,
  );
}

export async function setOrderPriority(id: string, priority: OrderPriority): Promise<void> {
  await simulateLatency(150);
  db = db.map((o) => (o.id === id ? { ...o, priority } : o));
}

export async function addOrderNote(id: string, note: OrderNote): Promise<void> {
  await simulateLatency(200);
  db = db.map((o) => (o.id === id ? { ...o, notes: [...o.notes, note] } : o));
}

export async function setOrderStatus(id: string, status: Order['status']): Promise<void> {
  await simulateLatency(200);
  db = db.map((o) => (o.id === id ? { ...o, status } : o));
}

export async function restoreOrders(previous: Order[]): Promise<void> {
  await simulateLatency(150);
  db = [...previous];
}
