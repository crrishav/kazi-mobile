export const directorsKeys = {
  all: ['directors'] as const,
  list: () => [...directorsKeys.all, 'list'] as const,
};
