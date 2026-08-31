export const attendanceKeys = {
  all: ['attendance'] as const,
  clock: () => [...attendanceKeys.all, 'clock'] as const,
  team: () => [...attendanceKeys.all, 'team'] as const,
  punches: () => [...attendanceKeys.all, 'punches'] as const,
  myMonth: () => [...attendanceKeys.all, 'my-month'] as const,
  memberMonths: () => [...attendanceKeys.all, 'member-month'] as const,
  memberMonth: (staffId: string, monthISO: string) => [...attendanceKeys.memberMonths(), staffId, monthISO] as const,
};
