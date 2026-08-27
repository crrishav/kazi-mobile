import { simulateLatency } from '../mock/delay';
import { seedLibrary, seedMovements, seedStock } from './mock';
import type { LibraryItem, StockItem, StockMoveKind, StockMovement } from './types';

let stockDb: StockItem[] = [...seedStock];
let movementsDb: StockMovement[] = seedMovements.map((m) => ({ ...m }));

export async function fetchStock(): Promise<StockItem[]> {
  await simulateLatency();
  return [...stockDb];
}

export async function fetchLibrary(): Promise<LibraryItem[]> {
  await simulateLatency(300);
  return seedLibrary;
}

export async function fetchMovements(): Promise<StockMovement[]> {
  await simulateLatency(250);
  return [...movementsDb];
}

export async function addStockItem(item: StockItem): Promise<void> {
  await simulateLatency(300);
  stockDb = [item, ...stockDb];
}

export async function updateStockItem(id: string, updates: Partial<StockItem>): Promise<void> {
  await simulateLatency(220);
  stockDb = stockDb.map((s) => (s.id === id ? { ...s, ...updates } : s));
}

/**
 * Post a stock movement (item 19). `in` / `out` apply a signed `qty`; `adjust`
 * sets the on-hand count to `qty` absolute. Updates the item's `qty` and
 * appends a ledger row with the running balance. Returns the new movement.
 */
export async function postStockMovement(input: {
  itemId: string;
  kind: StockMoveKind;
  qty: number;
  reason: string;
  ref: string;
}): Promise<StockMovement | null> {
  await simulateLatency(240);
  const item = stockDb.find((s) => s.id === input.itemId);
  if (!item) return null;
  const delta = input.kind === 'in' ? input.qty : input.kind === 'out' ? -input.qty : input.qty - item.qty;
  const balance = Math.max(0, item.qty + delta);
  stockDb = stockDb.map((s) => (s.id === item.id ? { ...s, qty: balance } : s));
  const movement: StockMovement = {
    id: `m${Date.now()}`,
    itemId: item.id,
    kind: input.kind,
    delta,
    balance,
    reason: input.reason || (input.kind === 'in' ? 'Stock in' : input.kind === 'out' ? 'Stock out' : 'Count adjustment'),
    ref: input.ref,
    date: new Date().toISOString().slice(0, 10),
  };
  movementsDb = [movement, ...movementsDb];
  return movement;
}

export async function restoreInventory(prevStock: StockItem[], prevMovements: StockMovement[]): Promise<void> {
  await simulateLatency(150);
  stockDb = [...prevStock];
  movementsDb = [...prevMovements];
}

/**
 * Bump an item's quantity by `delta` (negative to issue). Matched
 * case-insensitively by name — used by Purchases auto stock-in.
 * Returns the matched item's name, or null if nothing matched.
 */
export async function adjustStockByName(name: string, delta: number): Promise<string | null> {
  await simulateLatency(150);
  const key = name.trim().toLowerCase();
  const match = stockDb.find((s) => s.name.toLowerCase() === key);
  if (!match) return null;
  const balance = Math.max(0, match.qty + delta);
  stockDb = stockDb.map((s) => (s.id === match.id ? { ...s, qty: balance } : s));
  movementsDb = [
    {
      id: `m${Date.now()}`,
      itemId: match.id,
      kind: delta >= 0 ? 'in' : 'out',
      delta,
      balance,
      reason: delta >= 0 ? 'Auto stock-in · purchase' : 'Auto stock-out',
      ref: 'Purchases',
      date: new Date().toISOString().slice(0, 10),
    },
    ...movementsDb,
  ];
  return match.name;
}
