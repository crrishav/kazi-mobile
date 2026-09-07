/**
 * Live `customers` writers — the reference ERP's own collection.
 *
 * The eight editable fields are exactly the web form's, minus `region`: mobile
 * never sends that key, so an existing row keeps the region the web app filed
 * it under. `since` is derived from `created_at` and `orders`/`invoices` are
 * joins, so neither is written here.
 */

import { createDocument, patchDocument, removeDocument } from '@/lib/supabase/write';

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
  if (c.notes !== undefined) out.notes = c.notes;
  return out;
}

export async function addCustomer(customer: Customer): Promise<void> {
  await createDocument(COLLECTION, toLive(customer));
}

export async function updateCustomer(id: string, updates: Partial<Customer>): Promise<void> {
  const fields = toLive(updates);
  if (Object.keys(fields).length > 0) await patchDocument(COLLECTION, id, fields);
}

export async function deleteCustomer(id: string): Promise<void> {
  await removeDocument(COLLECTION, id);
}

/**
 * Snapshot restore (undo) — NOT reversed server-side this pass (a full-array
 * snapshot can't be safely diffed against the collection). The local view is
 * restored; the next refetch reflects the server.
 */
export async function restoreCustomers(_previous: Customer[]): Promise<void> {
  /* intentionally no live write */
}
