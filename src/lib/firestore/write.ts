/**
 * Write-side companion to `read.ts` for the Track B data swap.
 *
 * Every `src/data/<m>/firestore-write.ts` maps a mobile mutation onto the SAME
 * Firestore collection the reference ERP uses — a mobile edit shows up in the
 * web app and vice-versa. Every `src/data/<m>/api.ts` wraps its live writer in
 * {@link liveWrite}, which:
 *   1. runs the Firestore write,
 *   2. on ANY failure logs it loudly (`console.error` with the tag) — a denied
 *      rule / bad shape / offline is NOT swallowed silently, so you can see the
 *      write didn't persist,
 *   3. then always applies the in-memory mock write too, so a subsequent
 *      fallback read (see `withMockFallback`) stays consistent with the UI.
 *
 * Hooks must `invalidateQueries` after a write so the next read reflects the
 * server rather than the optimistic cache.
 *
 * New docs carry `source: 'kazi-mobile'` + a server `createdAt`; patches carry a
 * server `updatedAt`. Deletes are hard deletes — mirror the reference app.
 */

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  setDoc,
  updateDoc,
  type DocumentData,
} from 'firebase/firestore';

import { getDb, isFirebaseConfigured } from '@/lib/firebase';

/** Drop `undefined` values — Firestore rejects them. `null` is kept (a real clear). */
function clean<T extends DocumentData>(obj: T): DocumentData {
  const out: DocumentData = {};
  for (const [k, v] of Object.entries(obj)) if (v !== undefined) out[k] = v;
  return out;
}

/** `addDoc` + `source`/`createdAt` stamp. Resolves to the new doc id. */
export async function createDocument(name: string, data: DocumentData): Promise<string> {
  const ref = await addDoc(collection(getDb(), name), {
    ...clean(data),
    source: 'kazi-mobile',
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

/** Partial `updateDoc` + `updatedAt` stamp. Only the passed fields change. */
export async function patchDocument(name: string, id: string, data: DocumentData): Promise<void> {
  await updateDoc(doc(getDb(), name, id), { ...clean(data), updatedAt: serverTimestamp() });
}

/**
 * `setDoc` at a caller-chosen id (merge by default). For collections the
 * reference app keys by a deterministic id (e.g. `attendance/{date}_{uid}`) —
 * no `source`/timestamp is injected, the caller passes the exact doc shape.
 */
export async function setDocument(
  name: string,
  id: string,
  data: DocumentData,
  opts: { merge?: boolean } = {},
): Promise<void> {
  await setDoc(doc(getDb(), name, id), clean(data), { merge: opts.merge ?? true });
}

/** Hard delete. */
export async function removeDocument(name: string, id: string): Promise<void> {
  await deleteDoc(doc(getDb(), name, id));
}

const loggedOk = new Set<string>();

/**
 * Wrap a live writer so it runs against Firestore first, then always applies the
 * mock writer with the same signature. A live-write error is logged (never
 * thrown) so the optimistic UI isn't rolled back for a mock-consistent state —
 * but you get a clear `live write FAILED` line telling you it wasn't persisted.
 *
 * Returns the mock writer unchanged when Firebase isn't configured.
 */
export function liveWrite<A extends unknown[], R>(
  tag: string,
  liveFn: (...args: A) => Promise<unknown>,
  mockFn: (...args: A) => Promise<R>,
): (...args: A) => Promise<R> {
  if (!isFirebaseConfigured) return mockFn;
  return async (...args: A) => {
    try {
      await liveFn(...args);
      if (__DEV__ && !loggedOk.has(tag)) {
        loggedOk.add(tag);
        console.log(`[firestore] ${tag}: live write OK`);
      }
    } catch (err) {
      console.error(
        `[firestore] ${tag}: live write FAILED (rules / shape / offline?) — mock only, NOT persisted`,
        err,
      );
    }
    return mockFn(...args);
  };
}
