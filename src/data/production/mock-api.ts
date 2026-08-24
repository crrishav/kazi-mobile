import { simulateLatency } from '../mock/delay';
import { seedBatches } from './mock';
import type { Batch } from './types';

let db: Batch[] = [...seedBatches];

export async function fetchBatches(): Promise<Batch[]> {
  await simulateLatency();
  return [...db];
}

export async function addBatch(batch: Batch): Promise<void> {
  await simulateLatency(300);
  db = [batch, ...db];
}

export async function updateBatch(id: string, updates: Partial<Batch>): Promise<void> {
  await simulateLatency(200);
  db = db.map((b) => (b.id === id ? { ...b, ...updates } : b));
}
