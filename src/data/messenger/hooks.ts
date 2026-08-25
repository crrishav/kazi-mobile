import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { messengerKeys } from './keys';
import * as api from './mock-api';
import type { Message, ThreadId } from './types';

export function useMessages() {
  return useQuery({ queryKey: messengerKeys.messages(), queryFn: api.fetchMessages });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ threadId, text }: { threadId: ThreadId; text: string }) => api.sendMessage(threadId, text),
    onMutate: async ({ threadId, text }) => {
      await queryClient.cancelQueries({ queryKey: messengerKeys.messages() });
      const previous = queryClient.getQueryData<Partial<Record<ThreadId, Message[]>>>(messengerKeys.messages());
      const existing = previous?.[threadId] ?? [];
      queryClient.setQueryData(messengerKeys.messages(), {
        ...previous,
        [threadId]: [...existing, { from: 'me', text, meta: 'Just now · Sent' }],
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(messengerKeys.messages(), context.previous);
    },
  });
}

export function useReadStatus() {
  return useQuery({ queryKey: messengerKeys.readStatus(), queryFn: api.fetchReadStatus });
}

export function useMarkRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (threadId: ThreadId) => api.markRead(threadId),
    onMutate: async (threadId) => {
      await queryClient.cancelQueries({ queryKey: messengerKeys.readStatus() });
      const previous = queryClient.getQueryData<Partial<Record<ThreadId, boolean>>>(messengerKeys.readStatus());
      queryClient.setQueryData(messengerKeys.readStatus(), { ...previous, [threadId]: true });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(messengerKeys.readStatus(), context.previous);
    },
  });
}
