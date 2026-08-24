import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { financeKeys } from './keys';
import * as api from './mock-api';
import type { Expense } from './types';

export function useExpenses() {
  return useQuery({ queryKey: financeKeys.expenses(), queryFn: api.fetchExpenses });
}

export function useAddExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (expense: Expense) => api.addExpense(expense),
    onMutate: async (expense) => {
      await queryClient.cancelQueries({ queryKey: financeKeys.expenses() });
      queryClient.setQueryData<Expense[]>(financeKeys.expenses(), (old) => [expense, ...(old ?? [])]);
    },
  });
}

/** Undo restores the pre-add snapshot the screen captured before mutating — mirrors the prototype's own snapshot-based undo. */
export function useUndoExpenses() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (previous: Expense[]) => api.restoreExpenses(previous),
    onMutate: async (previous) => {
      await queryClient.cancelQueries({ queryKey: financeKeys.expenses() });
      queryClient.setQueryData<Expense[]>(financeKeys.expenses(), previous);
    },
  });
}
