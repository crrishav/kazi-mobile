export const accountingKeys = {
  all: ['accounting'] as const,
  adjustments: () => [...accountingKeys.all, 'adjustments'] as const,
};
