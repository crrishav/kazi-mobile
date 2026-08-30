/**
 * Live `customers` writers — the reference ERP's own collection.
 * `type`/`role`/`terms`/`since` are mobile-only and not persisted; `orders` /
 * `invoices` are joins, never written here.
 */

import { createDocument, patchDocument, removeDocument } from '@/lib/firestore/write';

import type { Customer } from './types';

const COLLECTION = 'customers';

/** Map the subset of mobile fields that exist on the live doc. */
function toLive(c: Partial<Customer>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (c.name !== undefined) out.name = c.name;
  if (c.contact !== undefined) out.contactPerson = c.contact;
  if (c.email !== undefined) out.email = c.email;
  if (c.phone !== undefined) out.phone = c.phone;
  if (c.country !== undefined) out.country = c.country;
  if (c.city !== undefined) out.city = c.city;
  if (c.address !== undefined) out.address = c.address;
  return out;
}

export async function addCustomer(customer: Customer): Promise<void> {
  await createDocument(COLLECTION, { ...toLive(customer), notes: '' });
}

export async function updateCustomer(id: string, updates: Partial<Customer>): Promise<void> {
  const fields = toLive(updates);
  if (Object.keys(fields).length > 0) await patchDocument(COLLECTION, id, fields);
}

export async function deleteCustomer(id: string): Promise<void> {
  await removeDocument(COLLECTION, id);
}

/**
 * Snapshot restore (undo) — NOT reversed in Firestore this pass (a full-array
 * snapshot can't be safely diffed against the collection). The local view is
 * restored; the next refetch reflects the server.
 */
export async function restoreCustomers(_previous: Customer[]): Promise<void> {
  /* intentionally no live write */
}
