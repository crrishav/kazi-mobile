export const directorsKeys = {
  all: ['directors'] as const,
  directory: () => [...directorsKeys.all, 'directory'] as const,
};
