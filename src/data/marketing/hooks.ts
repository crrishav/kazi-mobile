import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { marketingKeys } from './keys';
import * as api from './mock-api';
import type { CalendarEntry } from './types';

export function useEntries() {
  return useQuery({ queryKey: marketingKeys.list(), queryFn: api.fetchEntries });
}

export function useAddEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (entry: CalendarEntry) => api.addEntry(entry),
    onMutate: async (entry) => {
      await queryClient.cancelQueries({ queryKey: marketingKeys.list() });
      queryClient.setQueryData<CalendarEntry[]>(marketingKeys.list(), (old) => [...(old ?? []), entry]);
    },
  });
}

interface UpdateContext {
  previous?: CalendarEntry[];
}

export function useUpdateEntry() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { id: string; updates: Partial<CalendarEntry> }, UpdateContext>({
    mutationFn: ({ id, updates }) => api.updateEntry(id, updates),
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: marketingKeys.list() });
      const previous = queryClient.getQueryData<CalendarEntry[]>(marketingKeys.list());
      queryClient.setQueryData<CalendarEntry[]>(marketingKeys.list(), (old) => (old ?? []).map((e) => (e.id === id ? { ...e, ...updates } : e)));
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(marketingKeys.list(), context.previous);
    },
  });
}

export function useRemoveEntry() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string, UpdateContext>({
    mutationFn: (id) => api.removeEntry(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: marketingKeys.list() });
      const previous = queryClient.getQueryData<CalendarEntry[]>(marketingKeys.list());
      queryClient.setQueryData<CalendarEntry[]>(marketingKeys.list(), (old) => (old ?? []).filter((e) => e.id !== id));
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(marketingKeys.list(), context.previous);
    },
  });
}

/** Undo just re-appends the removed entry — the prototype's own `undo()` doesn't track position either, since render order comes from date sorting, not array order. */
export function useRestoreEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (entry: CalendarEntry) => api.restoreEntry(entry),
    onMutate: async (entry) => {
      await queryClient.cancelQueries({ queryKey: marketingKeys.list() });
      queryClient.setQueryData<CalendarEntry[]>(marketingKeys.list(), (old) => [...(old ?? []), entry]);
    },
  });
}
