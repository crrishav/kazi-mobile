/**
 * Read-only Firestore access for the Track B data swap.
 *
 * Every `src/data/<m>/firestore.ts` reader goes through here, and every
 * `src/data/<m>/api.ts` selector wraps its live reader in `withMockFallback` so a
 * denied rule / offline / shape surprise degrades to the in-memory mock instead
 * of blanking a screen. **Reads only** — nothing in this module writes.
 */

import {
  collection,
  getDocs,
  query,
  where,
  type QueryConstraint,
} from 'firebase/firestore';

import { getDb } from '@/lib/firebase';

/** The plain object handed to a mapper — Firestore `DocumentData` without the SDK type. */
export type DocData = Record<string, unknown>;

/**
 * Read a whole collection and map each doc to `T`. A mapper may return `null` to
 * drop a doc (wrong `type`, missing key field, …). Throws on any Firestore error
 * so `withMockFallback` can catch it.
 */
export async function readCollection<T>(
  name: string,
  map: (id: string, data: DocData) => T | null,
): Promise<T[]> {
  const snap = await getDocs(collection(getDb(), name));
  const out: T[] = [];
  for (const d of snap.docs) {
    const mapped = map(d.id, d.data() as DocData);
    if (mapped != null) out.push(mapped);
  }
  return out;
}

/**
 * Like {@link readCollection} but with equality filters applied server-side.
 * Equality-only (no `orderBy`/`limit`) so no composite index is ever required —
 * ordering and capping happen in the mapper's caller.
 */
export async function readCollectionWhere<T>(
  name: string,
  filters: Record<string, string | number | boolean>,
  map: (id: string, data: DocData) => T | null,
): Promise<T[]> {
  const constraints: QueryConstraint[] = Object.entries(filters).map(([k, v]) => where(k, '==', v));
  const snap = await getDocs(query(collection(getDb(), name), ...constraints));
  const out: T[] = [];
  for (const d of snap.docs) {
    const mapped = map(d.id, d.data() as DocData);
    if (mapped != null) out.push(mapped);
  }
  return out;
}

const loggedOk = new Set<string>();

/**
 * Wrap a live reader so a failure falls back to the mock reader with the same
 * signature. Only **errors** fall back — an empty live result is returned as-is
 * (an empty collection is a valid answer, not a reason to show seed data).
 *
 * In dev it logs the first successful live read per tag (`live read OK`) and
 * every fallback (`live read failed → mock`) so you can see, per module, whether
 * Firestore is actually feeding the screen.
 */
export function withMockFallback<A extends unknown[], R>(
  tag: string,
  liveFn: (...args: A) => Promise<R>,
  mockFn: (...args: A) => Promise<R>,
): (...args: A) => Promise<R> {
  return async (...args: A) => {
    try {
      const result = await liveFn(...args);
      if (__DEV__ && !loggedOk.has(tag)) {
        loggedOk.add(tag);
        const count = Array.isArray(result) ? ` (${result.length} rows)` : '';
        console.log(`[firestore] ${tag}: live read OK${count}`);
      }
      return result;
    } catch (err) {
      console.warn(`[firestore] ${tag}: live read failed → mock`, err);
      return mockFn(...args);
    }
  };
}
