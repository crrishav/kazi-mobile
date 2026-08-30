/**
 * Live `employees` writers — the reference ERP's own collection.
 *
 * The mobile `Employee.id` is a sequential number assigned by the reader over
 * the doc-id-sorted roster; it doesn't address a live doc. `resolveDocId`
 * re-derives the exact same ordering to map a numeric id back to its Firestore
 * doc id for updates / deletes.
 *
 * Payroll month approvals (`fetchApprovals` / `approveMonth`) have no live
 * collection and stay mock-only.
 */

import { collection, getDocs } from 'firebase/firestore';

import { getDb } from '@/lib/firebase';
import { str } from '@/lib/firestore/normalise';
import { createDocument, patchDocument, removeDocument } from '@/lib/firestore/write';
import { getActor } from '@/data/notifications/actor';

import type { Employee } from './types';

const COLLECTION = 'employees';

/** Numeric mobile id → live doc id, mirroring `firestore.ts` fetchEmployees ordering. */
async function resolveDocId(numericId: number): Promise<string | null> {
  const snap = await getDocs(collection(getDb(), COLLECTION));
  const docIds = snap.docs
    .filter((d) => str((d.data() as Record<string, unknown>).name).trim())
    .map((d) => d.id)
    .sort((a, b) => a.localeCompare(b));
  return docIds[numericId - 1] ?? null;
}

function toLive(e: Partial<Employee>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (e.name !== undefined) out.name = e.name;
  if (e.role !== undefined) out.role = e.role;
  if (e.dept !== undefined) out.department = e.dept;
  if (e.active !== undefined) out.status = e.active ? 'Active' : 'Inactive';
  if (e.joined !== undefined) out.joinDate = e.joined;
  if (e.bank !== undefined) out.bankName = e.bank;
  if (e.acct !== undefined) out.bankAccount = e.acct;
  if (e.branch !== undefined) out.bankBranch = e.branch;
  if (e.basic !== undefined) out.basicSalaryNPR = e.basic;
  return out;
}

export async function addEmployee(employee: Employee): Promise<void> {
  await createDocument(COLLECTION, {
    ...toLive(employee),
    reportsTo: '',
    isProductionWorker: false,
    updatedBy: getActor()?.name ?? 'kazi-mobile',
  });
}

export async function updateEmployee(id: number, updates: Partial<Employee>): Promise<void> {
  const docId = await resolveDocId(id);
  if (!docId) throw new Error(`updateEmployee: no live doc for mobile id ${id}`);
  const fields = toLive(updates);
  if (Object.keys(fields).length > 0) {
    await patchDocument(COLLECTION, docId, { ...fields, updatedBy: getActor()?.name ?? 'kazi-mobile' });
  }
}

export async function deleteEmployee(id: number): Promise<void> {
  const docId = await resolveDocId(id);
  if (!docId) throw new Error(`deleteEmployee: no live doc for mobile id ${id}`);
  await removeDocument(COLLECTION, docId);
}

export async function restoreEmployees(_previous: Employee[]): Promise<void> {
  /* snapshot undo — not reversed in Firestore this pass */
}
