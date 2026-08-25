export const messengerKeys = {
  all: ['messenger'] as const,
  messages: () => [...messengerKeys.all, 'messages'] as const,
  readStatus: () => [...messengerKeys.all, 'read-status'] as const,
};
