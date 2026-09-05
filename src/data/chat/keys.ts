export const chatKeys = {
  all: ['messenger'] as const,
  threads: () => [...chatKeys.all, 'threads'] as const,
  messages: () => [...chatKeys.all, 'messages'] as const,
  unread: () => [...chatKeys.all, 'unread'] as const,
};
