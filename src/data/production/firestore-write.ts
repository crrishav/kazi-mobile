/**
 * Live `production` writers — the reference ERP's own collection. Live docs are
 * per-stage counts (`cut`/`stitched`/`passed`/`rejected`) with no stage string,
 * so only the count-bearing mobile edits round-trip:
 *   - inspected output  → `passed` / `rejected`
 *   - a logged note     → `note`
 * Stage / status moves have no live field and stay mock-only.
 */

import { createDocument, patchDocument } from '@/lib/firestore/write';
import { getActor } from '@/data/notifications/actor';

import type { Batch } from './types';

const COLLECTION = 'production';

function qtyNumber(qty: string): number {
  const n = parseInt(qty.replace(/[^0-9]/g, ''), 10);
  return Number.isFinite(n) ? n : 0;
}

export async function addBatch(batch: Batch): Promise<void> {
  await createDocument(COLLECTION, {
    batchId: batch.ref || batch.code,
    date: new Date().toISOString().slice(0, 10),
    cut: qtyNumber(batch.qty),
    stitched: 0,
    passed: batch.output?.passed ?? 0,
    rejected: batch.output?.failed ?? 0,
    note: batch.notes[0]?.body ?? '',
    loggedBy: getActor()?.name ?? 'kazi-mobile',
  });
}

export async function updateBatch(id: string, updates: Partial<Batch>): Promise<void> {
  const fields: Record<string, unknown> = {};
  if (updates.output) {
    fields.passed = updates.output.passed;
    fields.rejected = updates.output.failed;
  }
  if (updates.notes && updates.notes.length > 0) {
    fields.note = updates.notes[updates.notes.length - 1].body;
  }
  if (Object.keys(fields).length > 0) await patchDocument(COLLECTION, id, fields);
}
