export const qualityControlKeys = {
  all: ['quality-control'] as const,
  queue: () => [...qualityControlKeys.all, 'queue'] as const,
};
