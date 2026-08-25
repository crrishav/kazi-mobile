export const attendanceKeys = {
  all: ['attendance'] as const,
  clock: () => [...attendanceKeys.all, 'clock'] as const,
  team: () => [...attendanceKeys.all, 'team'] as const,
};
