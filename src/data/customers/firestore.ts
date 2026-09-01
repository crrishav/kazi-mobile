/**
 * Live `customers` reader (Track B, read-only). Writes stay on `mock-api.ts`.
 *
 * Live shape (sampled 2026-08-30):
 *   { name, contactPerson, email, phone, country, city, address, notes, createdAt }
 *
 * Gaps handled locally (see plan §Batch 1):
 *   - no `type`  → 'company'
 *   - no `role`  → ''
 *   - no `terms` → ''
 *   - `since`    ← year of `createdAt`
 *   - `orders`/`invoices` → [] (the screen fills these from the Sales/Billing
 *     joins in `src/data/customers/joins.ts`)
 */

import { str, tsToISO } from '@/lib/firestore/normalise';
import { readCollection, type DocData } from '@/lib/supabase/read';

import type { Customer } from './types';

function mapCustomerDoc(id: string, d: DocData): Customer | null {
  const name = str(d.name).trim();
  if (!name) return null;
  const createdISO = tsToISO(d.createdAt);
  return {
    id,
    type: 'company',
    name,
    contact: str(d.contactPerson).trim(),
    role: '',
    email: str(d.email).trim(),
    phone: str(d.phone).trim(),
    city: str(d.city).trim(),
    country: str(d.country).trim(),
    address: str(d.address).trim(),
    terms: '',
    since: createdISO ? createdISO.slice(0, 4) : '',
    orders: [],
    invoices: [],
  };
}

export async function fetchCustomers(): Promise<Customer[]> {
  return readCollection('customers', mapCustomerDoc);
}
