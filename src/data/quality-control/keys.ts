export const qualityControlKeys = {
  all: ['quality-control'] as const,
  queue: () => [...qualityControlKeys.all, 'queue'] as const,
  logs: () => [...qualityControlKeys.all, 'logs'] as const,
};
