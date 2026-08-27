import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { attendanceKeys } from './keys';
import * as api from './mock-api';
import type { ClockToggleInput } from './mock-api';
import type { AttendanceStatus, ClockStatus, TeamMember } from './types';

export function useClockStatus() {
  return useQuery({ queryKey: attendanceKeys.clock(), queryFn: api.fetchClockStatus });
}

/** GPS clock-in / clock-out — payload carries the fix (or a bypass flag) per item 26. */
export function useToggleClock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ClockToggleInput) => api.toggleClock(input),
    onSuccess: (data: ClockStatus) => {
      queryClient.setQueryData(attendanceKeys.clock(), data);
      queryClient.invalidateQueries({ queryKey: attendanceKeys.punches() });
    },
  });
}

/** Raw GPS punches — reference `clock_ins` collection (item 26). */
export function useClockPunches() {
  return useQuery({ queryKey: attendanceKeys.punches(), queryFn: api.fetchClockPunches });
}

export function useTeamRoster() {
  return useQuery({ queryKey: attendanceKeys.team(), queryFn: api.fetchTeam });
}

/** Admin roll-call: set one staffer's status for the day (item 27). */
export function useSetMemberStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: AttendanceStatus }) => api.setMemberStatus(id, status),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: attendanceKeys.team() });
      queryClient.setQueryData<TeamMember[]>(attendanceKeys.team(), (old) =>
        (old ?? []).map((m) => (m.id === id ? { ...m, status } : m)),
      );
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: attendanceKeys.team() }),
  });
}

export function useRestoreTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (previous: TeamMember[]) => api.restoreTeam(previous),
    onMutate: async (previous) => {
      await queryClient.cancelQueries({ queryKey: attendanceKeys.team() });
      queryClient.setQueryData<TeamMember[]>(attendanceKeys.team(), previous);
    },
  });
}
