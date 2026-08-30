/**
 * Live `qc_logs` writers — the reference ERP's own collection. The QC queue is a
 * local derivation off `production` with no live collection, so its mutations
 * (`removeFromQueue` / `restoreToQueue`) stay mock-only.
 */

import { createDocument } from '@/lib/firestore/write';
import { getActor } from '@/data/notifications/actor';

import type { CheckVerdict, QcLog } from './types';

const COLLECTION = 'qc_logs';

const VERDICT_TO_ACTION: Record<CheckVerdict, string> = {
  pass: 'Pass',
  flag: 'Rework',
  fail: 'Reject',
};

export async function addQcLog(log: QcLog): Promise<void> {
  await createDocument(COLLECTION, {
    qcId: log.code,
    batchId: log.batchId,
    date: log.date,
    inspected: log.checkedCount,
    passed: log.passedCount,
    rejected: log.defects,
    defectType: log.defectNotes,
    action: VERDICT_TO_ACTION[log.verdict],
    checkedBy: log.inspector || getActor()?.name || 'kazi-mobile',
  });
}

/** Snapshot restore (undo) — not reversed in Firestore this pass. */
export async function restoreQcLogs(_previous: QcLog[]): Promise<void> {
  /* intentionally no live write */
}
