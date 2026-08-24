import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { salesKeys } from './keys';
import * as api from './mock-api';
import type { Order } from './types';

export function useOrders() {
  return useQuery({ queryKey: salesKeys.list(), queryFn: api.fetchOrders });
}

interface UpdateContext {
  previous?: Order[];
}

export function useUpdateOrder() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { id: string; updates: Partial<Order> }, UpdateContext>({
    mutationFn: ({ id, updates }) => api.updateOrder(id, updates),
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: salesKeys.list() });
      const previous = queryClient.getQueryData<Order[]>(salesKeys.list());
      queryClient.setQueryData<Order[]>(salesKeys.list(), (old) => (old ?? []).map((o) => (o.id === id ? { ...o, ...updates } : o)));
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(salesKeys.list(), context.previous);
    },
  });
}

/** Undo restores the pre-mutation snapshot the screen captured — mirrors the prototype's own snapshot-based undo. */
export function useRestoreOrders() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (previous: Order[]) => api.restoreOrders(previous),
    onMutate: async (previous) => {
      await queryClient.cancelQueries({ queryKey: salesKeys.list() });
      queryClient.setQueryData<Order[]>(salesKeys.list(), previous);
    },
  });
}
