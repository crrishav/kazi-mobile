import { simulateLatency } from '../mock/delay';
import { seedQueue } from './mock';
import type { QueueItem } from './types';

let db: QueueItem[] = [...seedQueue];

export async function fetchQueue(): Promise<QueueItem[]> {
  await simulateLatency();
  return [...db];
}

export async function removeFromQueue(id: string): Promise<void> {
  await simulateLatency(250);
  db = db.filter((q) => q.id !== id);
}

export async function restoreToQueue(item: QueueItem, index: number): Promise<void> {
  await simulateLatency(150);
  const next = db.slice();
  next.splice(Math.min(index, next.length), 0, item);
  db = next;
}
