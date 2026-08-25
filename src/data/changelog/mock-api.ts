import { simulateLatency } from '../mock/delay';
import { RELEASES } from './mock';
import type { Release } from './types';

/** Read-only per the design's own "Read-only" badge — no mutations, just a fetch. */
export async function fetchReleases(): Promise<Release[]> {
  await simulateLatency();
  return RELEASES;
}
