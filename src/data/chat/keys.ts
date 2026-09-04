export const chatKeys = {
  all: ['messenger'] as const,
  messages: () => [...chatKeys.all, 'messages'] as const,
  readStatus: () => [...chatKeys.all, 'read-status'] as const,
};
