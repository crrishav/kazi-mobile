import { simulateLatency } from '../mock/delay';
import { seedRequirements } from './mock';
import type { Requirement } from './types';

let db: Requirement[] = [...seedRequirements];

export async function fetchRequirements(): Promise<Requirement[]> {
  await simulateLatency();
  return [...db];
}

export async function addRequirement(entry: Requirement): Promise<void> {
  await simulateLatency(300);
  db = [entry, ...db];
}

export async function updateRequirement(id: string, updates: Partial<Requirement>): Promise<void> {
  await simulateLatency(250);
  db = db.map((r) => (r.id === id ? { ...r, ...updates } : r));
}

export async function restoreRequirements(previous: Requirement[]): Promise<void> {
  await simulateLatency(150);
  db = [...previous];
}
