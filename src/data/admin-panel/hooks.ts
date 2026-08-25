import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { adminPanelKeys } from './keys';
import * as api from './mock-api';
import type { AccessLevel, PermissionMatrix, RoleKey, SectionId } from './types';

export function usePermissionMatrix() {
  return useQuery({ queryKey: adminPanelKeys.matrix(), queryFn: api.fetchPermissionMatrix });
}

/** Applying is final in this module's own logic — no undo affordance, matching the source screen's own `apply()`. */
export function useApplyRoleChanges() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ role, changes }: { role: RoleKey; changes: Partial<Record<SectionId, AccessLevel>> }) =>
      api.applyRoleChanges(role, changes),
    onMutate: async ({ role, changes }) => {
      await queryClient.cancelQueries({ queryKey: adminPanelKeys.matrix() });
      const previous = queryClient.getQueryData<PermissionMatrix>(adminPanelKeys.matrix());
      if (previous) {
        queryClient.setQueryData(adminPanelKeys.matrix(), { ...previous, [role]: { ...previous[role], ...changes } });
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(adminPanelKeys.matrix(), context.previous);
    },
  });
}
