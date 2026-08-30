import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { notify } from '@/data/notifications/notify';

import { inventoryKeys } from './keys';
import * as api from './mock-api';
import type { StockItem, StockMoveKind, StockMovement } from './types';

function lowStockNotify(item: StockItem | undefined, projectedQty: number) {
  if (!item || projectedQty > item.threshold) return;
  notify({
    eventType: 'inventory.low_stock',
    section: 'inventory',
    targetRef: item.sku,
    payload: { label: item.name, count: projectedQty },
  });
}

export function useStock() {
  return useQuery({ queryKey: inventoryKeys.stock(), queryFn: api.fetchStock });
}

export function useLibrary() {
  return useQuery({ queryKey: inventoryKeys.library(), queryFn: api.fetchLibrary });
}

export function useStockMovements() {
  return useQuery({ queryKey: inventoryKeys.movements(), queryFn: api.fetchMovements });
}

export function useAddStockItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (item: StockItem) => api.addStockItem(item),
    onMutate: async (item) => {
      await queryClient.cancelQueries({ queryKey: inventoryKeys.stock() });
      queryClient.setQueryData<StockItem[]>(inventoryKeys.stock(), (old) => [item, ...(old ?? [])]);
    },
    onSuccess: (_data, item) => {
      notify({ eventType: 'inventory.item_added', section: 'inventory', targetRef: item.sku, payload: { label: item.name } });
    },
  });
}

/** Editable detail fields — threshold / lead / location / cost / supplier (item 19). */
export function useUpdateStockItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<StockItem> }) => api.updateStockItem(id, updates),
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: inventoryKeys.stock() });
      queryClient.setQueryData<StockItem[]>(inventoryKeys.stock(), (old) =>
        (old ?? []).map((s) => (s.id === id ? { ...s, ...updates } : s)),
      );
    },
  });
}

/** Post a stock-in / stock-out / adjustment; updates `qty` + appends a ledger row (item 19). */
export function usePostStockMovement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { itemId: string; kind: StockMoveKind; qty: number; reason: string; ref: string }) =>
      api.postStockMovement(input),
    onSuccess: (_data, { itemId, kind, qty }) => {
      const item = queryClient.getQueryData<StockItem[]>(inventoryKeys.stock())?.find((s) => s.id === itemId);
      notify({
        eventType: 'inventory.adjusted',
        section: 'inventory',
        targetRef: item?.sku,
        payload: { label: item?.name, count: qty },
      });
      const delta = kind === 'out' ? -qty : kind === 'in' ? qty : 0;
      if (item && delta !== 0) lowStockNotify(item, Math.max(0, item.qty + delta));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.stock() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.movements() });
    },
  });
}

export function useRestoreInventory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ stock, movements }: { stock: StockItem[]; movements: StockMovement[] }) =>
      api.restoreInventory(stock, movements),
    onMutate: async ({ stock, movements }) => {
      await queryClient.cancelQueries({ queryKey: inventoryKeys.stock() });
      queryClient.setQueryData<StockItem[]>(inventoryKeys.stock(), stock);
      queryClient.setQueryData<StockMovement[]>(inventoryKeys.movements(), movements);
    },
  });
}

/** Auto stock-in / stock-out by item name. Used by Purchases when a line matches an inventory item. */
export function useAdjustStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, delta }: { name: string; delta: number }) => api.adjustStockByName(name, delta),
    onMutate: async ({ name, delta }) => {
      await queryClient.cancelQueries({ queryKey: inventoryKeys.stock() });
      const key = name.trim().toLowerCase();
      queryClient.setQueryData<StockItem[]>(inventoryKeys.stock(), (old) =>
        (old ?? []).map((s) => (s.name.toLowerCase() === key ? { ...s, qty: Math.max(0, s.qty + delta) } : s)),
      );
    },
    onSuccess: (_data, { name, delta }) => {
      const key = name.trim().toLowerCase();
      const item = queryClient.getQueryData<StockItem[]>(inventoryKeys.stock())?.find((s) => s.name.toLowerCase() === key);
      if (item) lowStockNotify(item, item.qty); // cache already reflects the new qty here
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.stock() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.movements() });
    },
  });
}
