import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { inventoryKeys } from './keys';
import * as api from './mock-api';
import type { StockItem } from './types';

export function useStock() {
  return useQuery({ queryKey: inventoryKeys.stock(), queryFn: api.fetchStock });
}

export function useLibrary() {
  return useQuery({ queryKey: inventoryKeys.library(), queryFn: api.fetchLibrary });
}

export function useAddStockItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (item: StockItem) => api.addStockItem(item),
    onMutate: async (item) => {
      await queryClient.cancelQueries({ queryKey: inventoryKeys.stock() });
      queryClient.setQueryData<StockItem[]>(inventoryKeys.stock(), (old) => [item, ...(old ?? [])]);
    },
  });
}
