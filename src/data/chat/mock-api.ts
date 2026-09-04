import { simulateLatency } from '../mock/delay';
import { SEED_MESSAGES } from './mock';
import type { Message, ThreadId } from './types';

let messages: Partial<Record<ThreadId, Message[]>> = { ...SEED_MESSAGES };
let readStatus: Partial<Record<ThreadId, boolean>> = {};

export async function fetchMessages(): Promise<Partial<Record<ThreadId, Message[]>>> {
  await simulateLatency();
  return { ...messages };
}

export async function sendMessage(threadId: ThreadId, text: string): Promise<void> {
  await simulateLatency(150);
  const existing = messages[threadId] ?? [];
  messages = { ...messages, [threadId]: [...existing, { from: 'me', text, meta: 'Just now · Sent' }] };
}

export async function fetchReadStatus(): Promise<Partial<Record<ThreadId, boolean>>> {
  await simulateLatency();
  return { ...readStatus };
}

export async function markRead(threadId: ThreadId): Promise<void> {
  await simulateLatency(100);
  readStatus = { ...readStatus, [threadId]: true };
}
