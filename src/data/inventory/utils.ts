import type { StockItem, StockLevel } from './types';

export function stockRatio(item: Pick<StockItem, 'qty' | 'threshold'>): number {
  return item.qty / (item.threshold * 2);
}

export function stockLevel(item: Pick<StockItem, 'qty' | 'threshold'>): StockLevel {
  if (item.qty < item.threshold) return 'low';
  if (item.qty < item.threshold * 1.15) return 'near';
  return 'ok';
}
