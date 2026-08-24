import { simulateLatency } from '../mock/delay';

/** Delta-adjustments layered on top of each account's seed balance — posting an entry updates this, never the seed. */
let adjustments: Record<string, number> = {};

export async function fetchAdjustments(): Promise<Record<string, number>> {
  await simulateLatency();
  return { ...adjustments };
}

export async function postAdjustments(next: Record<string, number>): Promise<void> {
  await simulateLatency(300);
  adjustments = { ...next };
}

export async function restoreAdjustments(previous: Record<string, number>): Promise<void> {
  await simulateLatency(150);
  adjustments = { ...previous };
}
