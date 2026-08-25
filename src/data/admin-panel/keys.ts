export const adminPanelKeys = {
  all: ['admin-panel'] as const,
  matrix: () => [...adminPanelKeys.all, 'matrix'] as const,
};
