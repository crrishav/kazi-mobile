import { simulateLatency } from '../mock/delay';
import { PEOPLE } from './mock';
import type { Director } from './types';

export async function fetchDirectors(): Promise<Director[]> {
  await simulateLatency();
  return [...PEOPLE];
}
