/**
 * Read side of the Supabase swap — a drop-in replacement for
 * `@/lib/firestore/read`, with the same three exports and the same
 * signatures, so no per-module mapper had to change.
 *
 * How the shapes still line up: Postgres holds a clean relational schema,
 * but `supabase/migrations/0010_compat_views.sql` exposes `fs_<collection>`
 * views shaped like the old Firestore documents (camelCase fields, `id` as
 * text, line items rebuilt into the JSON arrays the mappers expect). Those
 * views are `security_invoker`, so RLS on the underlying tables applies to
 * every read here.
 *
 * **Reads only** — nothing in this module writes.
 */

import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';

/** The plain object handed to a mapper — a row from a compat view. */
export type DocData = Record<string, unknown>;

/**
 * Firestore collection name → compat view. Anything not listed is assumed to
 * already be named `fs_<name>`; an unmapped collection is a bug, not a
 * fallback, so it throws rather than silently reading nothing.
 */
const VIEW_BY_COLLECTION: Record<string, string> = {
  accounts: 'fs_accounts',
  attendance: 'fs_attendance',
  bank_transactions: 'fs_bank_transactions',
  budget_requests: 'fs_budget_requests',
  challans: 'fs_challans',
  clock_ins: 'fs_clock_ins',
  content: 'fs_content',
  content_calendar: 'fs_content_calendar',
  counters: 'fs_counters',
  customers: 'fs_customers',
  employees: 'fs_employees',
  fabrics: 'fs_fabrics',
  mobile_notifications: 'fs_mobile_notifications',
  order_assignments: 'fs_order_assignments',
  order_costs: 'fs_order_costs',
  samples: 'fs_samples',
  stock_movements: 'fs_stock_movements',
  user_points: 'fs_user_points',
  vat_bills: 'fs_vat_bills',
  finance_expenses: 'fs_finance_expenses',
  finance_payroll: 'fs_finance_payroll',
  finance_purchases: 'fs_finance_purchases',
  inventory: 'fs_inventory',
  invoices: 'fs_invoices',
  journal_entries: 'fs_journal_entries',
  messages: 'fs_messages',
  orders: 'fs_orders',
  patterns: 'fs_patterns',
  processes: 'fs_processes',
  product_costs: 'fs_product_costs',
  production: 'fs_production',
  qc_logs: 'fs_qc_logs',
  quotations: 'fs_quotations',
  stage_config: 'fs_stage_config',
  task_columns: 'fs_task_columns',
  tasks: 'fs_tasks',
  unit_economics: 'fs_unit_economics',
  users: 'fs_users',
};

export function viewFor(collection: string): string {
  const view = VIEW_BY_COLLECTION[collection];
  if (!view) throw new Error(`No Supabase compat view mapped for collection "${collection}"`);
  return view;
}

/**
 * Read a whole collection and map each row to `T`. A mapper may return `null`
 * to drop a row. Throws on any Supabase error so `withMockFallback` can catch
 * it — note an RLS denial is NOT an error, it comes back as zero rows.
 */
export async function readCollection<T>(
  name: string,
  map: (id: string, data: DocData) => T | null,
): Promise<T[]> {
  const { data, error } = await getSupabase().from(viewFor(name)).select('*');
  if (error) throw new Error(`${name}: ${error.message}`);
  const out: T[] = [];
  for (const row of data ?? []) {
    const mapped = map(String((row as DocData).id ?? ''), row as DocData);
    if (mapped != null) out.push(mapped);
  }
  return out;
}

/** Like {@link readCollection} but with equality filters applied server-side. */
export async function readCollectionWhere<T>(
  name: string,
  filters: Record<string, string | number | boolean>,
  map: (id: string, data: DocData) => T | null,
): Promise<T[]> {
  let q = getSupabase().from(viewFor(name)).select('*');
  for (const [k, v] of Object.entries(filters)) q = q.eq(k, v);
  const { data, error } = await q;
  if (error) throw new Error(`${name}: ${error.message}`);
  const out: T[] = [];
  for (const row of data ?? []) {
    const mapped = map(String((row as DocData).id ?? ''), row as DocData);
    if (mapped != null) out.push(mapped);
  }
  return out;
}

/** Fetch a single row by id, or null when it isn't there / isn't visible. */
export async function readDocument(name: string, id: string): Promise<DocData | null> {
  const { data, error } = await getSupabase()
    .from(viewFor(name))
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(`${name}/${id}: ${error.message}`);
  return (data as DocData) ?? null;
}

const loggedOk = new Set<string>();

/**
 * Wrap a live reader so a failure falls back to the mock reader with the same
 * signature. Only **errors** fall back — an empty live result is returned
 * as-is, because under RLS "you may not see these rows" is a valid answer and
 * must not be papered over with seed data.
 */
export function withMockFallback<A extends unknown[], R>(
  tag: string,
  liveFn: (...args: A) => Promise<R>,
  mockFn: (...args: A) => Promise<R>,
): (...args: A) => Promise<R> {
  return async (...args: A) => {
    if (!isSupabaseConfigured) return mockFn(...args);
    try {
      const result = await liveFn(...args);
      if (__DEV__ && !loggedOk.has(tag)) {
        loggedOk.add(tag);
        const count = Array.isArray(result) ? ` (${result.length} rows)` : '';
        console.log(`[supabase] ${tag}: live read OK${count}`);
      }
      return result;
    } catch (err) {
      console.warn(`[supabase] ${tag}: live read failed → mock`, err);
      return mockFn(...args);
    }
  };
}
