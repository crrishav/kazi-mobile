import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { attendanceKeys } from './keys';
import * as api from './mock-api';
import type { ClockStatus } from './types';

export function useClockStatus() {
  return useQuery({ queryKey: attendanceKeys.clock(), queryFn: api.fetchClockStatus });
}

export function useToggleClock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (elapsedSeconds: number) => api.toggleClock(elapsedSeconds),
    onSuccess: (data: ClockStatus) => {
      queryClient.setQueryData(attendanceKeys.clock(), data);
    },
  });
}

export function useTeamRoster() {
  return useQuery({ queryKey: attendanceKeys.team(), queryFn: api.fetchTeam });
}
