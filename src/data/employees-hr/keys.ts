export const employeesKeys = {
  all: ['employees-hr'] as const,
  list: () => [...employeesKeys.all, 'list'] as const,
  approvals: () => [...employeesKeys.all, 'approvals'] as const,
};
