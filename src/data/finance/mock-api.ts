import { simulateLatency } from '../mock/delay';
import { seedExpenses } from './mock';
import type { Expense } from './types';

let db: Expense[] = [...seedExpenses];

export async function fetchExpenses(): Promise<Expense[]> {
  await simulateLatency();
  return [...db];
}

export async function addExpense(expense: Expense): Promise<void> {
  await simulateLatency(300);
  db = [expense, ...db];
}

export async function restoreExpenses(previous: Expense[]): Promise<void> {
  await simulateLatency(150);
  db = [...previous];
}
