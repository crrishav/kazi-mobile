import { simulateLatency } from '../mock/delay';
import { seedLibrary, seedStock } from './mock';
import type { LibraryItem, StockItem } from './types';

let stockDb: StockItem[] = [...seedStock];

export async function fetchStock(): Promise<StockItem[]> {
  await simulateLatency();
  return [...stockDb];
}

export async function fetchLibrary(): Promise<LibraryItem[]> {
  await simulateLatency(300);
  return seedLibrary;
}

export async function addStockItem(item: StockItem): Promise<void> {
  await simulateLatency(300);
  stockDb = [item, ...stockDb];
}
