/**
 * Live `qc_logs` reader (Track B, read-only). Writes stay on `mock-api.ts`.
 * `fetchQueue` stays mock — it's a derivation off `production` batches, and the
 * live `production` collection is barely populated (§6).
 *
 * Live shape (sampled 2026-08-30): { qcId ("QC001"), batchId, date, inspected,
 *   passed, rejected, defectType, action, checkedBy, createdAt }
 */

import { num, str, tsToISO } from '@/lib/firestore/normalise';
import { readCollection, type DocData } from '@/lib/firestore/read';

import type { CheckVerdict, QcLog } from './types';

function mapVerdict(action: unknown, passRate: number): CheckVerdict {
  const s = str(action).trim().toLowerCase();
  if (/fail|reject|scrap/.test(s)) return 'fail';
  if (/flag|hold|rework|recheck/.test(s)) return 'flag';
  if (passRate < 90) return 'fail';
  if (passRate < 98) return 'flag';
  return 'pass';
}

function mapQcLogDoc(id: string, d: DocData): QcLog | null {
  const batchId = str(d.batchId).trim();
  const inspected = num(d.inspected);
  const passed = num(d.passed);
  const rejected = num(d.rejected);
  if (!batchId && !inspected) return null;
  const denom = passed + rejected;
  const passRate = denom > 0 ? Math.round((passed / denom) * 100) : 100;
  return {
    id,
    batchId,
    code: str(d.qcId).trim() || `QC-${id.slice(0, 4).toUpperCase()}`,
    product: batchId ? `Batch ${batchId}` : 'Inspection',
    date: str(d.date).trim() || tsToISO(d.createdAt).slice(0, 10),
    checkedCount: inspected || denom,
    passedCount: passed,
    defects: rejected,
    passRate,
    verdict: mapVerdict(d.action, passRate),
    defectNotes: str(d.defectType).trim(),
    inspector: str(d.checkedBy).trim(),
  };
}

export async function fetchQcLogs(): Promise<QcLog[]> {
  return readCollection('qc_logs', mapQcLogDoc);
}
