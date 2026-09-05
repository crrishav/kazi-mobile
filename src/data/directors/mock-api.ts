import { simulateLatency } from '../mock/delay';
import { ROLE_DIRECTORY } from './mock';
import type { RoleDirectory } from './types';

export async function fetchRoleDirectory(): Promise<RoleDirectory> {
  await simulateLatency();
  return ROLE_DIRECTORY;
}
