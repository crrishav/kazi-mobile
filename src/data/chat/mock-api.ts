import { simulateLatency } from '../mock/delay';
import { SEED_MESSAGES, SEED_THREADS, SEED_UNREAD } from './mock';
import { ME, type Message, type MessageId, type PersonId, type Thread, type ThreadId } from './types';

/**
 * In-memory store. Everything the UI can change — messages, reactions, unread
 * counts, pins, mutes, membership — lives here rather than in the seed, so a
 * real backend later swaps this module out without the screens noticing.
 */
let threads: Thread[] = SEED_THREADS.map((t) => ({ ...t, memberIds: [...t.memberIds] }));
let messages: Record<ThreadId, Message[]> = Object.fromEntries(
  Object.entries(SEED_MESSAGES).map(([id, list]) => [id, list.map((m) => ({ ...m, reactions: m.reactions.map((r) => ({ ...r, by: [...r.by] })) }))]),
);
let unread: Record<ThreadId, number> = { ...SEED_UNREAD };

let sequence = 0;
const nextId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${sequence++}`;

const cloneMessage = (m: Message): Message => ({ ...m, reactions: m.reactions.map((r) => ({ ...r, by: [...r.by] })) });

function snapshotMessages(): Record<ThreadId, Message[]> {
  return Object.fromEntries(Object.entries(messages).map(([id, list]) => [id, list.map(cloneMessage)]));
}

export async function fetchThreads(): Promise<Thread[]> {
  await simulateLatency();
  return threads.map((t) => ({ ...t, memberIds: [...t.memberIds] }));
}

export async function fetchMessages(): Promise<Record<ThreadId, Message[]>> {
  await simulateLatency();
  return snapshotMessages();
}

export async function fetchUnread(): Promise<Record<ThreadId, number>> {
  await simulateLatency();
  return { ...unread };
}

export async function sendMessage(threadId: ThreadId, text: string, replyTo?: MessageId): Promise<Message> {
  await simulateLatency(150);
  const message: Message = { id: nextId('m'), threadId, authorId: ME, text, at: Date.now(), replyTo, reactions: [] };
  messages = { ...messages, [threadId]: [...(messages[threadId] ?? []), message] };
  return cloneMessage(message);
}

/** Adds my reaction, or removes it if I'd already left that emoji. Reactions with nobody left are dropped. */
export async function toggleReaction(threadId: ThreadId, messageId: MessageId, emoji: string): Promise<void> {
  await simulateLatency(120);
  messages = {
    ...messages,
    [threadId]: (messages[threadId] ?? []).map((m) => {
      if (m.id !== messageId) return m;
      const existing = m.reactions.find((r) => r.emoji === emoji);
      if (!existing) return { ...m, reactions: [...m.reactions, { emoji, by: [ME] }] };
      const by = existing.by.includes(ME) ? existing.by.filter((id) => id !== ME) : [...existing.by, ME];
      return { ...m, reactions: m.reactions.map((r) => (r.emoji === emoji ? { ...r, by } : r)).filter((r) => r.by.length > 0) };
    }),
  };
}

/** Tombstones rather than removes, so a reply pointing at a deleted message still resolves. */
export async function deleteMessages(threadId: ThreadId, ids: MessageId[]): Promise<void> {
  await simulateLatency(150);
  const set = new Set(ids);
  messages = {
    ...messages,
    [threadId]: (messages[threadId] ?? []).map((m) => (set.has(m.id) ? { ...m, text: '', deleted: true, reactions: [] } : m)),
  };
}

export async function setThreadRead(threadId: ThreadId, read: boolean): Promise<void> {
  await simulateLatency(100);
  unread = { ...unread, [threadId]: read ? 0 : Math.max(1, unread[threadId] ?? 0) };
}

export async function setThreadFlag(threadId: ThreadId, flag: 'pinned' | 'muted', value: boolean): Promise<void> {
  await simulateLatency(120);
  threads = threads.map((t) => (t.id === threadId ? { ...t, [flag]: value } : t));
}

export async function deleteThread(threadId: ThreadId): Promise<void> {
  await simulateLatency(150);
  threads = threads.filter((t) => t.id !== threadId);
  const { [threadId]: _dropped, ...rest } = messages;
  messages = rest;
  const { [threadId]: _count, ...restUnread } = unread;
  unread = restUnread;
}

/** Reuses the existing dm with this person if there is one — starting a second one would split the history. */
export async function createDm(personId: PersonId): Promise<Thread> {
  await simulateLatency(200);
  const existing = threads.find((t) => t.kind === 'dm' && !t.missing && t.memberIds[0] === personId);
  if (existing) return { ...existing, memberIds: [...existing.memberIds] };

  const thread: Thread = { id: nextId('t'), kind: 'dm', memberIds: [personId], createdAt: Date.now() };
  threads = [...threads, thread];
  messages = { ...messages, [thread.id]: [] };
  unread = { ...unread, [thread.id]: 0 };
  return { ...thread, memberIds: [...thread.memberIds] };
}

export async function createGroup(name: string, memberIds: PersonId[]): Promise<Thread> {
  await simulateLatency(200);
  const thread: Thread = { id: nextId('t'), kind: 'group', name, memberIds: [...memberIds], avatarTint: 'dark', createdAt: Date.now() };
  threads = [...threads, thread];
  messages = { ...messages, [thread.id]: [] };
  unread = { ...unread, [thread.id]: 0 };
  return { ...thread, memberIds: [...thread.memberIds] };
}
