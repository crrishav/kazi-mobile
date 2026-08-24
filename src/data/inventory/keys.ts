export const inventoryKeys = {
  all: ['inventory'] as const,
  stock: () => [...inventoryKeys.all, 'stock'] as const,
  library: () => [...inventoryKeys.all, 'library'] as const,
};
