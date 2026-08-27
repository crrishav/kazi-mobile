import { simulateLatency } from '../mock/delay';
import { seedQcLogs, seedQueue } from './mock';
import type { QcLog, QueueItem } from './types';

let db: QueueItem[] = [...seedQueue];
let logsDb: QcLog[] = seedQcLogs.map((l) => ({ ...l }));

export async function fetchQueue(): Promise<QueueItem[]> {
  await simulateLatency();
  return [...db];
}

export async function fetchQcLogs(): Promise<QcLog[]> {
  await simulateLatency(250);
  return [...logsDb];
}

export async function addQcLog(log: QcLog): Promise<void> {
  await simulateLatency(200);
  logsDb = [log, ...logsDb];
}

export async function restoreQcLogs(previous: QcLog[]): Promise<void> {
  await simulateLatency(120);
  logsDb = [...previous];
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
