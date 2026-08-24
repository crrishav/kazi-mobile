import { STAGES } from './mock';
import type { Batch } from './types';

export function stageIndexOf(batch: Batch): number {
  return STAGES.findIndex((s) => s.key === batch.stage);
}

/** Per-stage segment color: completed stages take the ramp color (or a muted tone if the batch was cancelled), the rest stay on `incomplete`. */
export function segmentColors(batch: Batch, ramp: string[], incomplete: string, cancelledDone: string): string[] {
  const i = stageIndexOf(batch);
  return STAGES.map((_, idx) => (batch.status === 'cancelled' ? (idx <= i ? cancelledDone : incomplete) : idx <= i ? ramp[idx] : incomplete));
}
