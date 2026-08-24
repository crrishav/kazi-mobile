import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { qualityControlKeys } from './keys';
import * as api from './mock-api';
import type { QueueItem } from './types';

export function useQueue() {
  return useQuery({ queryKey: qualityControlKeys.queue(), queryFn: api.fetchQueue });
}

interface RemoveContext {
  previous?: QueueItem[];
}

export function useRemoveFromQueue() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, QueueItem, RemoveContext>({
    mutationFn: (item) => api.removeFromQueue(item.id),
    onMutate: async (item) => {
      await queryClient.cancelQueries({ queryKey: qualityControlKeys.queue() });
      const previous = queryClient.getQueryData<QueueItem[]>(qualityControlKeys.queue());
      queryClient.setQueryData<QueueItem[]>(qualityControlKeys.queue(), (old) => (old ?? []).filter((q) => q.id !== item.id));
      return { previous };
    },
    onError: (_err, _item, context) => {
      if (context?.previous) queryClient.setQueryData(qualityControlKeys.queue(), context.previous);
    },
  });
}

export function useRestoreToQueue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ item, index }: { item: QueueItem; index: number }) => api.restoreToQueue(item, index),
    onMutate: async ({ item, index }) => {
      await queryClient.cancelQueries({ queryKey: qualityControlKeys.queue() });
      queryClient.setQueryData<QueueItem[]>(qualityControlKeys.queue(), (old) => {
        const next = (old ?? []).slice();
        next.splice(Math.min(index, next.length), 0, item);
        return next;
      });
    },
  });
}
