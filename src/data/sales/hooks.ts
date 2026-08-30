import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { notify } from '@/data/notifications/notify';

import { salesKeys } from './keys';
import * as api from './api';
import type { Order, OrderNote, OrderPriority, StageId } from './types';

const ORDERS_SECTION = 'order-management' as const;

export function useOrders() {
  return useQuery({ queryKey: salesKeys.list(), queryFn: api.fetchOrders });
}

interface UpdateContext {
  previous?: Order[];
}

function patchList(queryClient: ReturnType<typeof useQueryClient>, fn: (orders: Order[]) => Order[]) {
  queryClient.setQueryData<Order[]>(salesKeys.list(), (old) => fn(old ?? []));
}

export function useAddOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (order: Order) => api.addOrder(order),
    onMutate: async (order) => {
      await queryClient.cancelQueries({ queryKey: salesKeys.list() });
      patchList(queryClient, (orders) => [order, ...orders]);
    },
    onSuccess: (_data, order) => {
      notify({
        eventType: 'order.created',
        section: ORDERS_SECTION,
        targetRef: order.ref,
        payload: { assignee: order.assignedTo, label: order.product },
      });
    },
  });
}

export function useUpdateOrder() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { id: string; updates: Partial<Order> }, UpdateContext>({
    mutationFn: ({ id, updates }) => api.updateOrder(id, updates),
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: salesKeys.list() });
      const previous = queryClient.getQueryData<Order[]>(salesKeys.list());
      patchList(queryClient, (orders) => orders.map((o) => (o.id === id ? { ...o, ...updates } : o)));
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(salesKeys.list(), context.previous);
    },
    onSuccess: (_data, { id, updates }, context) => {
      const prev = context?.previous?.find((o) => o.id === id);
      const ref = prev?.ref;
      if (updates.assignedTo && updates.assignedTo !== prev?.assignedTo) {
        notify({ eventType: 'order.assigned', section: ORDERS_SECTION, targetRef: ref, payload: { assignee: updates.assignedTo } });
      }
      if (updates.priority === 'high' && prev?.priority !== 'high') {
        notify({ eventType: 'order.priority_raised', section: ORDERS_SECTION, targetRef: ref, payload: { assignee: prev?.assignedTo, priority: 'High' } });
      }
      if (updates.status === 'cancelled' && prev?.status !== 'cancelled') {
        notify({ eventType: 'order.cancelled', section: ORDERS_SECTION, targetRef: ref, payload: { assignee: prev?.assignedTo } });
      }
    },
  });
}

export function useSetOrderStage() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { id: string; stage: StageId }, UpdateContext>({
    mutationFn: ({ id, stage }) => api.setOrderStage(id, stage),
    onMutate: async ({ id, stage }) => {
      await queryClient.cancelQueries({ queryKey: salesKeys.list() });
      const previous = queryClient.getQueryData<Order[]>(salesKeys.list());
      patchList(queryClient, (orders) =>
        orders.map((o) =>
          o.id === id && o.stage !== stage
            ? { ...o, stage, status: 'active', stageHistory: [...o.stageHistory, { stage, at: new Date().toISOString() }] }
            : o,
        ),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(salesKeys.list(), context.previous);
    },
    onSuccess: (_data, { id, stage }, context) => {
      const prev = context?.previous?.find((o) => o.id === id);
      if (!prev || prev.stage === stage) return;
      notify({
        eventType: 'order.stage_changed',
        section: ORDERS_SECTION,
        targetRef: prev.ref,
        payload: { assignee: prev.assignedTo, status: stage },
      });
      if (stage === 'delivered') {
        notify({
          eventType: 'order.dispatched',
          section: ORDERS_SECTION,
          targetRef: prev.ref,
          payload: { assignee: prev.assignedTo },
        });
      }
    },
  });
}

export function useSetOrderPriority() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { id: string; priority: OrderPriority }, UpdateContext>({
    mutationFn: ({ id, priority }) => api.setOrderPriority(id, priority),
    onMutate: async ({ id, priority }) => {
      await queryClient.cancelQueries({ queryKey: salesKeys.list() });
      const previous = queryClient.getQueryData<Order[]>(salesKeys.list());
      patchList(queryClient, (orders) => orders.map((o) => (o.id === id ? { ...o, priority } : o)));
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(salesKeys.list(), context.previous);
    },
    onSuccess: (_data, { id, priority }, context) => {
      if (priority !== 'high') return;
      const prev = context?.previous?.find((o) => o.id === id);
      if (prev?.priority === 'high') return;
      notify({
        eventType: 'order.priority_raised',
        section: ORDERS_SECTION,
        targetRef: prev?.ref,
        payload: { assignee: prev?.assignedTo, priority: 'High' },
      });
    },
  });
}

export function useAddOrderNote() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { id: string; note: OrderNote }, UpdateContext>({
    mutationFn: ({ id, note }) => api.addOrderNote(id, note),
    onMutate: async ({ id, note }) => {
      await queryClient.cancelQueries({ queryKey: salesKeys.list() });
      const previous = queryClient.getQueryData<Order[]>(salesKeys.list());
      patchList(queryClient, (orders) => orders.map((o) => (o.id === id ? { ...o, notes: [...o.notes, note] } : o)));
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(salesKeys.list(), context.previous);
    },
  });
}

export function useSetOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { id: string; status: Order['status'] }, UpdateContext>({
    mutationFn: ({ id, status }) => api.setOrderStatus(id, status),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: salesKeys.list() });
      const previous = queryClient.getQueryData<Order[]>(salesKeys.list());
      patchList(queryClient, (orders) => orders.map((o) => (o.id === id ? { ...o, status } : o)));
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(salesKeys.list(), context.previous);
    },
    onSuccess: (_data, { id, status }, context) => {
      if (status !== 'cancelled') return;
      const prev = context?.previous?.find((o) => o.id === id);
      if (prev?.status === 'cancelled') return;
      notify({
        eventType: 'order.cancelled',
        section: ORDERS_SECTION,
        targetRef: prev?.ref,
        payload: { assignee: prev?.assignedTo },
      });
    },
  });
}

/** Undo restores the pre-mutation snapshot the screen captured. */
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
