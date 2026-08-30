import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { notify } from '@/data/notifications/notify';

import { productionKeys } from './keys';
import * as api from './mock-api';
import type { Batch } from './types';

export function useBatches() {
  return useQuery({ queryKey: productionKeys.list(), queryFn: api.fetchBatches });
}

export function useAddBatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (batch: Batch) => api.addBatch(batch),
    onMutate: async (batch) => {
      await queryClient.cancelQueries({ queryKey: productionKeys.list() });
      queryClient.setQueryData<Batch[]>(productionKeys.list(), (old) => [batch, ...(old ?? [])]);
    },
    onSuccess: (_data, batch) => {
      notify({
        eventType: 'production.batch_created',
        section: 'production',
        targetRef: batch.code,
        payload: { loggedBy: batch.person, label: batch.product },
      });
    },
  });
}

interface UpdateContext {
  previous?: Batch[];
}

export function useUpdateBatch() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { id: string; updates: Partial<Batch> }, UpdateContext>({
    mutationFn: ({ id, updates }) => api.updateBatch(id, updates),
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: productionKeys.list() });
      const previous = queryClient.getQueryData<Batch[]>(productionKeys.list());
      queryClient.setQueryData<Batch[]>(productionKeys.list(), (old) =>
        (old ?? []).map((b) => (b.id === id ? { ...b, ...updates } : b)),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(productionKeys.list(), context.previous);
    },
    onSuccess: (_data, { id, updates }, context) => {
      const batch = context?.previous?.find((b) => b.id === id);
      if (updates.output) {
        notify({
          eventType: 'production.output_logged',
          section: 'production',
          targetRef: batch?.code,
          payload: { loggedBy: batch?.person, label: batch?.product },
        });
      }
      if (updates.status === 'hold' && batch?.status !== 'hold') {
        notify({
          eventType: 'production.batch_blocked',
          section: 'production',
          targetRef: batch?.code,
          payload: { workerNames: batch?.person ? [batch.person] : [], label: batch?.product },
        });
      }
    },
  });
}
