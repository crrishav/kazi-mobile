export function officeHours(office: string): string {
  if (office === 'London') return '09:00–18:00 GMT+1';
  if (office === 'Dubai') return 'board only · GMT+4';
  return '08:00–17:00 GMT+5:45';
}
