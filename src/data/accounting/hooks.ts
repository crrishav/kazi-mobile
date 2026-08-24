import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { accountingKeys } from './keys';
import * as api from './mock-api';

export function useAdjustments() {
  return useQuery({ queryKey: accountingKeys.adjustments(), queryFn: api.fetchAdjustments });
}

export function usePostAdjustments() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (next: Record<string, number>) => api.postAdjustments(next),
    onMutate: async (next) => {
      await queryClient.cancelQueries({ queryKey: accountingKeys.adjustments() });
      queryClient.setQueryData(accountingKeys.adjustments(), next);
    },
  });
}

/** Undo restores the pre-post snapshot the screen captured — mirrors the prototype's own snapshot-based undo. */
export function useRestoreAdjustments() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (previous: Record<string, number>) => api.restoreAdjustments(previous),
    onMutate: async (previous) => {
      await queryClient.cancelQueries({ queryKey: accountingKeys.adjustments() });
      queryClient.setQueryData(accountingKeys.adjustments(), previous);
    },
  });
}
