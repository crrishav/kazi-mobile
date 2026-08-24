import { simulateLatency } from '../mock/delay';
import { seedEntries } from './mock';
import type { PurchaseEntry } from './types';

let db: PurchaseEntry[] = [...seedEntries];

export async function fetchEntries(): Promise<PurchaseEntry[]> {
  await simulateLatency();
  return [...db];
}

export async function addEntry(entry: PurchaseEntry): Promise<void> {
  await simulateLatency(300);
  db = [entry, ...db];
}

export async function updateEntry(id: string, updates: Partial<PurchaseEntry>): Promise<void> {
  await simulateLatency(250);
  db = db.map((e) => (e.id === id ? { ...e, ...updates } : e));
}

export async function restoreEntries(previous: PurchaseEntry[]): Promise<void> {
  await simulateLatency(150);
  db = [...previous];
}
