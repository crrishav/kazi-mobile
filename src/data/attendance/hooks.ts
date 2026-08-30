import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { notify } from '@/data/notifications/notify';

import { attendanceKeys } from './keys';
import * as api from './api';
import type { ClockToggleInput } from './api';
import type { AttendanceStatus, ClockStatus, TeamMember } from './types';

export function useClockStatus() {
  return useQuery({ queryKey: attendanceKeys.clock(), queryFn: api.fetchClockStatus });
}

/** GPS clock-in / clock-out — payload carries the fix (or a bypass flag) per item 26. */
export function useToggleClock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ClockToggleInput) => api.toggleClock(input),
    onSuccess: (data: ClockStatus, input) => {
      queryClient.setQueryData(attendanceKeys.clock(), data);
      queryClient.invalidateQueries({ queryKey: attendanceKeys.punches() });
      // Re-derive the session from Firestore (`fetchClockStatus` reads today's clock_ins).
      queryClient.invalidateQueries({ queryKey: attendanceKeys.clock() });
      // A clock-IN that bypassed the geofence or had no GPS fix is worth flagging.
      if (data.clockedIn && (input.bypassUsed || !input.coords)) {
        notify({
          eventType: 'attendance.clock_in_flagged',
          section: 'attendance',
          payload: { employee: input.staffName, label: input.bypassUsed ? 'geofence bypassed' : 'no GPS fix' },
        });
      }
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
    mutationFn: ({ id, status, name }: { id: number; status: AttendanceStatus; name?: string }) =>
      api.setMemberStatus(id, status, name),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: attendanceKeys.team() });
      queryClient.setQueryData<TeamMember[]>(attendanceKeys.team(), (old) =>
        (old ?? []).map((m) => (m.id === id ? { ...m, status } : m)),
      );
    },
    onSuccess: (_data, { id, status }) => {
      if (status !== 'absent' && status !== 'late') return;
      const member = queryClient.getQueryData<TeamMember[]>(attendanceKeys.team())?.find((m) => m.id === id);
      notify({
        eventType: 'attendance.absent_late',
        section: 'attendance',
        payload: { employee: member?.name, status: status === 'absent' ? 'Absent' : 'Late' },
      });
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
