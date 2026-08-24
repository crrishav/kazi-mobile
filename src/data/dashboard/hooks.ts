import { useQuery, useQueryClient } from '@tanstack/react-query';

import { dashboardKeys } from './keys';
import * as api from './mock-api';

export function useDashboardSummary() {
  return useQuery({ queryKey: dashboardKeys.summary(), queryFn: api.fetchDashboardSummary });
}

/** Drives the pull-to-refresh's "just now" -> "2 min ago" relabel, matching the prototype's timed refetch. */
export function useRefreshDashboard() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: dashboardKeys.summary() });
}
