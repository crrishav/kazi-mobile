import { useQuery } from '@tanstack/react-query';
import { collection, getDocs } from 'firebase/firestore';

import { ROLES, type Role } from '@/auth/roles';
import { TEAM_MEMBERS } from '@/auth/team-members';
import { getDb, isFirebaseConfigured } from '@/lib/firebase';
import { str } from '@/lib/firestore/normalise';

import { notificationKeys } from './keys';
import type { RosterMember } from './types';

const ROLE_SET = new Set<string>(ROLES);
function asRole(v: unknown, fallback: Role = 'employee'): Role {
  return typeof v === 'string' && ROLE_SET.has(v) ? (v as Role) : fallback;
}

interface RawEmployee {
  id?: unknown;
  code?: unknown;
  name?: unknown;
  email?: unknown;
  role?: unknown;
  appRole?: unknown;
  location?: unknown;
  status?: unknown;
  reportsTo?: unknown;
}

/**
 * Everyone who could receive a notification: the live `employees` collection
 * (read-only, already used by the auth resolver) merged with the hard-coded
 * `TEAM_MEMBERS`. Deduped by email, inactive employees dropped. On any read
 * failure (rules, offline) it degrades to `TEAM_MEMBERS` alone.
 */
export async function fetchRoster(): Promise<RosterMember[]> {
  const byEmail = new Map<string, RosterMember>();

  if (isFirebaseConfigured) {
    try {
      const snap = await getDocs(collection(getDb(), 'employees'));
      const raws: (RawEmployee & { _key: string })[] = snap.docs.map((d) => ({
        ...(d.data() as RawEmployee),
        _key: d.id,
      }));

      // reportsTo can be an employee id/code or already a name — resolve to a name.
      const nameByKey = new Map<string, string>();
      for (const r of raws) {
        const nm = str(r.name).trim();
        if (!nm) continue;
        nameByKey.set(r._key, nm);
        if (r.id != null) nameByKey.set(String(r.id), nm);
        if (r.code != null) nameByKey.set(String(r.code), nm);
      }

      for (const r of raws) {
        const email = str(r.email).trim().toLowerCase();
        const name = str(r.name).trim();
        if (!email || !name) continue;
        if (str(r.status).toLowerCase() === 'inactive') continue;
        const reports = r.reportsTo == null ? '' : String(r.reportsTo);
        byEmail.set(email, {
          email,
          name,
          role: asRole(r.appRole ?? r.role),
          location: str(r.location).toLowerCase() === 'uk' ? 'uk' : 'nepal',
          managerName: nameByKey.get(reports) ?? (reports && !/^\d+$/.test(reports) ? reports : undefined),
        });
      }
    } catch (err) {
      console.warn('[notifications] employees roster read failed — using TEAM_MEMBERS only', err);
    }
  }

  for (const m of TEAM_MEMBERS) {
    const email = m.email.toLowerCase();
    if (byEmail.has(email)) continue;
    byEmail.set(email, { email, name: m.name, role: m.appRole, location: m.location });
  }

  return [...byEmail.values()];
}

export function useRecipientRoster() {
  return useQuery({
    queryKey: notificationKeys.roster(),
    queryFn: fetchRoster,
    staleTime: 10 * 60 * 1000,
  });
}
