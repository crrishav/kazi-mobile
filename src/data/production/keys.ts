export const productionKeys = {
  all: ['production'] as const,
  list: () => [...productionKeys.all, 'list'] as const,
};
