import { simulateLatency } from '../mock/delay';
import { seedApprovals } from './mock';
import type { ApprovalItem } from './types';

// In-memory store with real-repository-shaped functions — swapping this
// module for a Firebase-backed one later shouldn't require touching hooks.ts
// or any screen.
let db: ApprovalItem[] = [...seedApprovals];

export async function fetchApprovals(): Promise<ApprovalItem[]> {
  await simulateLatency();
  return [...db];
}

export async function decideApproval(id: string): Promise<void> {
  await simulateLatency(300);
  db = db.filter((a) => a.id !== id);
}

export async function restoreApproval(item: ApprovalItem, index: number): Promise<void> {
  await simulateLatency(150);
  const next = db.slice();
  next.splice(Math.min(index, next.length), 0, item);
  db = next;
}
