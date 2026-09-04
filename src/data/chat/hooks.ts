import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { notify } from '@/data/notifications/notify';

import { chatKeys } from './keys';
import { PEOPLE } from './mock';
import * as api from './mock-api';
import type { Message, ThreadId } from './types';

const parseMentions = (text: string): string[] =>
  [...text.matchAll(/@([\p{L}][\p{L}\d._-]*)/gu)].map((m) => m[1]);

export function useMessages() {
  return useQuery({ queryKey: chatKeys.messages(), queryFn: api.fetchMessages });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ threadId, text }: { threadId: ThreadId; text: string }) => api.sendMessage(threadId, text),
    onMutate: async ({ threadId, text }) => {
      await queryClient.cancelQueries({ queryKey: chatKeys.messages() });
      const previous = queryClient.getQueryData<Partial<Record<ThreadId, Message[]>>>(chatKeys.messages());
      const existing = previous?.[threadId] ?? [];
      queryClient.setQueryData(chatKeys.messages(), {
        ...previous,
        [threadId]: [...existing, { from: 'me', text, meta: 'Just now · Sent' }],
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(chatKeys.messages(), context.previous);
    },
    onSuccess: (_data, { threadId, text }) => {
      const who = PEOPLE[threadId]?.name;
      const preview = text.length > 120 ? `${text.slice(0, 117)}…` : text;
      notify({
        eventType: 'message.received',
        section: 'messenger',
        payload: { participants: who ? [who] : [], label: preview },
      });
      const mentions = parseMentions(text);
      if (mentions.length) {
        notify({ eventType: 'message.mention', section: 'messenger', payload: { mentions, label: preview } });
      }
    },
  });
}

export function useReadStatus() {
  return useQuery({ queryKey: chatKeys.readStatus(), queryFn: api.fetchReadStatus });
}

export function useMarkRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (threadId: ThreadId) => api.markRead(threadId),
    onMutate: async (threadId) => {
      await queryClient.cancelQueries({ queryKey: chatKeys.readStatus() });
      const previous = queryClient.getQueryData<Partial<Record<ThreadId, boolean>>>(chatKeys.readStatus());
      queryClient.setQueryData(chatKeys.readStatus(), { ...previous, [threadId]: true });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(chatKeys.readStatus(), context.previous);
    },
  });
}
