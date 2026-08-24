import { simulateLatency } from '../mock/delay';
import { seedOrders } from './mock';
import type { Order } from './types';

let db: Order[] = [...seedOrders];

export async function fetchOrders(): Promise<Order[]> {
  await simulateLatency();
  return [...db];
}

export async function updateOrder(id: string, updates: Partial<Order>): Promise<void> {
  await simulateLatency(250);
  db = db.map((o) => (o.id === id ? { ...o, ...updates } : o));
}

export async function restoreOrders(previous: Order[]): Promise<void> {
  await simulateLatency(150);
  db = [...previous];
}
