export const approvalsKeys = {
  all: ['approvals'] as const,
  list: () => [...approvalsKeys.all, 'list'] as const,
};
