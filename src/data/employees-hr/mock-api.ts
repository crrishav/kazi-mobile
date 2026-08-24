import { simulateLatency } from '../mock/delay';
import { PEOPLE } from './mock';
import type { Employee, MonthKey } from './types';

let db: Employee[] = [...PEOPLE];
let approvals: Record<string, boolean> = {};

export async function fetchEmployees(): Promise<Employee[]> {
  await simulateLatency();
  return [...db];
}

export async function addEmployee(employee: Employee): Promise<void> {
  await simulateLatency(300);
  db = [...db, employee];
}

export async function updateEmployee(id: number, updates: Partial<Employee>): Promise<void> {
  await simulateLatency(250);
  db = db.map((e) => (e.id === id ? { ...e, ...updates } : e));
}

export async function fetchApprovals(): Promise<Record<string, boolean>> {
  await simulateLatency();
  return { ...approvals };
}

export async function approveMonth(key: MonthKey): Promise<void> {
  await simulateLatency(300);
  approvals = { ...approvals, [key]: true };
}
