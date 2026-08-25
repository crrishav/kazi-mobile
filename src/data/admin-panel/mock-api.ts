import { simulateLatency } from '../mock/delay';
import { BASE_PERMISSIONS } from './mock';
import type { AccessLevel, PermissionMatrix, RoleKey, SectionId } from './types';

function clone(m: PermissionMatrix): PermissionMatrix {
  const out = {} as PermissionMatrix;
  (Object.keys(m) as RoleKey[]).forEach((k) => {
    out[k] = { ...m[k] };
  });
  return out;
}

/** In-memory "applied" matrix — what's actually in effect, distinct from a screen's staged/pending edits. */
let matrix: PermissionMatrix = clone(BASE_PERMISSIONS);

export async function fetchPermissionMatrix(): Promise<PermissionMatrix> {
  await simulateLatency();
  return clone(matrix);
}

export async function applyRoleChanges(role: RoleKey, changes: Partial<Record<SectionId, AccessLevel>>): Promise<void> {
  await simulateLatency(300);
  matrix = { ...matrix, [role]: { ...matrix[role], ...changes } };
}
