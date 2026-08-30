/**
 * Live `production` reader (Track B, read-only). Writes stay on `mock-api.ts`.
 *
 * Live shape (sampled 2026-08-30): { batchId, date, cut, stitched, passed,
 *   rejected, note, loggedBy, createdAt } — per-stage counts, **no stage string**
 * and no product name (FRONTEND_GAP_PLAN §6).
 *
 * Gaps handled locally (see plan §Batch 1):
 *   - no `product`/`ref`/`due` → `batchId`-derived / '—'
 *   - `stage`  → inferred from which counts are non-zero
 *   - `status` → 'done' once passed+rejected covers the cut count, else 'active'
 *   - `output` ← { checked: passed+rejected, passed, failed: rejected }
 */

import { num, str, tsToISO } from '@/lib/firestore/normalise';
import { readCollection, type DocData } from '@/lib/firestore/read';

import { PEOPLE } from './mock';
import type { Batch, BatchStatus, StageKey } from './types';

function mapPerson(raw: unknown): string {
  const name = str(raw).trim();
  if (!name) return PEOPLE[0].id;
  const first = name.split(/\s+/)[0].toLowerCase();
  const hit = PEOPLE.find((p) => p.name.toLowerCase() === first);
  if (hit) return hit.id;
  let h = 0;
  for (let i = 0; i < name.length; i += 1) h = (h * 31 + name.charCodeAt(i)) | 0;
  return PEOPLE[Math.abs(h) % PEOPLE.length].id;
}

function inferStage(cut: number, stitched: number, passed: number, rejected: number): StageKey {
  if (passed + rejected > 0 && passed + rejected >= cut && cut > 0) return 'delivered';
  if (passed + rejected > 0) return 'packing';
  if (stitched > 0) return 'finishing';
  if (cut > 0) return 'cutting';
  return 'received';
}

function mapBatchDoc(id: string, d: DocData): Batch | null {
  const batchId = str(d.batchId).trim() || id.slice(0, 6).toUpperCase();
  const cut = num(d.cut);
  const stitched = num(d.stitched);
  const passed = num(d.passed);
  const rejected = num(d.rejected);
  const stage = inferStage(cut, stitched, passed, rejected);
  const status: BatchStatus = stage === 'delivered' ? 'done' : 'active';
  const dateISO = str(d.date).trim() || tsToISO(d.createdAt).slice(0, 10);
  const day = dateISO ? new Date(dateISO).getDate() || 0 : 0;
  const person = mapPerson(d.loggedBy);
  const note = str(d.note).trim();
  const qtyBase = Math.max(cut, stitched, passed + rejected);

  return {
    id,
    product: `Batch ${batchId}`,
    code: batchId,
    ref: batchId,
    qty: qtyBase ? `${qtyBase.toLocaleString('en-US')} pcs` : '—',
    due: '—',
    stage,
    status,
    person,
    day: Number.isNaN(day) ? 0 : day,
    photos: [],
    notes: note ? [{ id: 'n1', who: person, body: note, time: dateISO, photo: null }] : [],
    output: passed + rejected > 0 ? { checked: passed + rejected, passed, failed: rejected } : undefined,
  };
}

export async function fetchBatches(): Promise<Batch[]> {
  return readCollection('production', mapBatchDoc);
}
