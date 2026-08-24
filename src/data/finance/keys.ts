export const financeKeys = {
  all: ['finance'] as const,
  expenses: () => [...financeKeys.all, 'expenses'] as const,
};
