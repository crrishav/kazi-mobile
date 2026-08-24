import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { approvalsKeys } from './keys';
import * as api from './mock-api';
import type { ApprovalItem } from './types';

export function useApprovals() {
  return useQuery({ queryKey: approvalsKeys.list(), queryFn: api.fetchApprovals });
}

interface DecideContext {
  previous?: ApprovalItem[];
}

/** Optimistic remove, with a cache-snapshot rollback if the mock call unexpectedly rejects. */
export function useDecideApproval() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, ApprovalItem, DecideContext>({
    mutationFn: (item) => api.decideApproval(item.id),
    onMutate: async (item) => {
      await queryClient.cancelQueries({ queryKey: approvalsKeys.list() });
      const previous = queryClient.getQueryData<ApprovalItem[]>(approvalsKeys.list());
      queryClient.setQueryData<ApprovalItem[]>(approvalsKeys.list(), (old) => (old ?? []).filter((a) => a.id !== item.id));
      return { previous };
    },
    onError: (_err, _item, context) => {
      if (context?.previous) queryClient.setQueryData(approvalsKeys.list(), context.previous);
    },
  });
}

/**
 * A second, independent optimistic mutation — Undo follows a *successful*
 * decide, so it re-inserts at the original index rather than restoring an
 * error-rollback snapshot (a different mechanism for a different purpose).
 */
export function useUndoApproval() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ item, index }: { item: ApprovalItem; index: number }) => api.restoreApproval(item, index),
    onMutate: async ({ item, index }) => {
      await queryClient.cancelQueries({ queryKey: approvalsKeys.list() });
      queryClient.setQueryData<ApprovalItem[]>(approvalsKeys.list(), (old) => {
        const next = (old ?? []).slice();
        next.splice(Math.min(index, next.length), 0, item);
        return next;
      });
    },
  });
}
