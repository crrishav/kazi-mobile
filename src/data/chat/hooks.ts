import { useMutation, useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query';

import { notify } from '@/data/notifications/notify';

import { chatKeys } from './keys';
import * as api from './mock-api';
import { ME, type Message, type MessageId, type PersonId, type Thread, type ThreadId } from './types';
import { firstName, threadTitle } from './utils';

type MessageMap = Record<ThreadId, Message[]>;
type UnreadMap = Record<ThreadId, number>;

const parseMentions = (text: string): string[] =>
  [...text.matchAll(/@([\p{L}][\p{L}\d._-]*)/gu)].map((m) => m[1]);

export function useThreads() {
  return useQuery({ queryKey: chatKeys.threads(), queryFn: api.fetchThreads });
}

export function useMessages() {
  return useQuery({ queryKey: chatKeys.messages(), queryFn: api.fetchMessages });
}

export function useUnread() {
  return useQuery({ queryKey: chatKeys.unread(), queryFn: api.fetchUnread });
}

/**
 * Every mutation below writes the cache optimistically and rolls back on
 * error: a chat that waits on a round-trip before showing your own tap feels
 * broken even when the round-trip is 150ms of fake latency.
 */
function useOptimistic<TVars, TData>(
  key: QueryKey,
  mutationFn: (vars: TVars) => Promise<unknown>,
  apply: (current: TData | undefined, vars: TVars) => TData,
  onSuccess?: (vars: TVars) => void,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onMutate: async (vars: TVars) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<TData>(key);
      queryClient.setQueryData<TData>(key, apply(previous, vars));
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous !== undefined) queryClient.setQueryData<TData>(key, context.previous);
    },
    onSuccess: (_data, vars) => onSuccess?.(vars),
  });
}

export interface SendMessageVars {
  threadId: ThreadId;
  text: string;
  replyTo?: MessageId;
  /** Only used for the notification copy — the thread itself is looked up by id. */
  thread?: Thread;
}

export function useSendMessage() {
  return useOptimistic<SendMessageVars, MessageMap>(
    chatKeys.messages(),
    ({ threadId, text, replyTo }) => api.sendMessage(threadId, text, replyTo),
    (current, { threadId, text, replyTo }) => ({
      ...(current ?? {}),
      [threadId]: [
        ...(current?.[threadId] ?? []),
        { id: `pending-${Date.now()}`, threadId, authorId: ME, text, at: Date.now(), replyTo, reactions: [] },
      ],
    }),
    ({ text, thread }) => {
      const preview = text.length > 120 ? `${text.slice(0, 117)}…` : text;
      notify({
        eventType: 'message.received',
        section: 'messenger',
        payload: { participants: thread ? [threadTitle(thread)] : [], label: preview },
      });
      const mentions = parseMentions(text);
      if (mentions.length) {
        notify({ eventType: 'message.mention', section: 'messenger', payload: { mentions, label: preview } });
      }
    },
  );
}

export interface ReactionVars {
  threadId: ThreadId;
  messageId: MessageId;
  emoji: string;
}

export function useToggleReaction() {
  return useOptimistic<ReactionVars, MessageMap>(
    chatKeys.messages(),
    ({ threadId, messageId, emoji }) => api.toggleReaction(threadId, messageId, emoji),
    (current, { threadId, messageId, emoji }) => ({
      ...(current ?? {}),
      [threadId]: (current?.[threadId] ?? []).map((m) => {
        if (m.id !== messageId) return m;
        const existing = m.reactions.find((r) => r.emoji === emoji);
        if (!existing) return { ...m, reactions: [...m.reactions, { emoji, by: [ME] }] };
        const by = existing.by.includes(ME) ? existing.by.filter((id) => id !== ME) : [...existing.by, ME];
        return { ...m, reactions: m.reactions.map((r) => (r.emoji === emoji ? { ...r, by } : r)).filter((r) => r.by.length > 0) };
      }),
    }),
  );
}

export interface DeleteMessagesVars {
  threadId: ThreadId;
  ids: MessageId[];
}

export function useDeleteMessages() {
  return useOptimistic<DeleteMessagesVars, MessageMap>(
    chatKeys.messages(),
    ({ threadId, ids }) => api.deleteMessages(threadId, ids),
    (current, { threadId, ids }) => {
      const set = new Set(ids);
      return {
        ...(current ?? {}),
        [threadId]: (current?.[threadId] ?? []).map((m) => (set.has(m.id) ? { ...m, text: '', deleted: true, reactions: [] } : m)),
      };
    },
  );
}

export interface SetReadVars {
  threadId: ThreadId;
  read: boolean;
}

export function useSetThreadRead() {
  return useOptimistic<SetReadVars, UnreadMap>(
    chatKeys.unread(),
    ({ threadId, read }) => api.setThreadRead(threadId, read),
    (current, { threadId, read }) => ({
      ...(current ?? {}),
      [threadId]: read ? 0 : Math.max(1, current?.[threadId] ?? 0),
    }),
  );
}

export interface ThreadFlagVars {
  threadId: ThreadId;
  flag: 'pinned' | 'muted';
  value: boolean;
}

export function useSetThreadFlag() {
  return useOptimistic<ThreadFlagVars, Thread[]>(
    chatKeys.threads(),
    ({ threadId, flag, value }) => api.setThreadFlag(threadId, flag, value),
    (current, { threadId, flag, value }) => (current ?? []).map((t) => (t.id === threadId ? { ...t, [flag]: value } : t)),
  );
}

export function useDeleteThread() {
  return useOptimistic<ThreadId, Thread[]>(
    chatKeys.threads(),
    (threadId) => api.deleteThread(threadId),
    (current, threadId) => (current ?? []).filter((t) => t.id !== threadId),
  );
}

export type CreateThreadVars = { kind: 'dm'; personId: PersonId } | { kind: 'group'; name: string; memberIds: PersonId[] };

/** Not optimistic — the caller needs the server-assigned id to navigate into the new thread. */
export function useCreateThread() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: CreateThreadVars) =>
      vars.kind === 'dm' ? api.createDm(vars.personId) : api.createGroup(vars.name, vars.memberIds),
    onSuccess: (thread, vars) => {
      queryClient.setQueryData<Thread[]>(chatKeys.threads(), (current) => {
        const rest = (current ?? []).filter((t) => t.id !== thread.id);
        return [...rest, thread];
      });
      queryClient.setQueryData<MessageMap>(chatKeys.messages(), (current) => ({ [thread.id]: [], ...(current ?? {}) }));
      queryClient.setQueryData<UnreadMap>(chatKeys.unread(), (current) => ({ ...(current ?? {}), [thread.id]: 0 }));
      if (vars.kind === 'group') {
        notify({
          eventType: 'message.received',
          section: 'messenger',
          payload: { participants: vars.memberIds.map(firstName), label: `${vars.name} created` },
        });
      }
    },
  });
}
