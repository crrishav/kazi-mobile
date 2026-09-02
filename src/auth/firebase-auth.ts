/**
 * Firebase Auth + the legacy Firestore profile chain.
 *
 * **This is the fallback source, not the primary one.** Postgres cannot verify
 * a Firebase token, so a session that exists only here reads no live data —
 * `real-auth.ts` prefers a Supabase session and comes back to this chain only
 * when there isn't one. It is kept because 8 of 11 staff have not yet set a
 * Supabase password, and dropping it would lock them out entirely.
 *
 * Session delivery is a subscription (`subscribeUser`) rather than a one-shot
 * read — `onAuthStateChanged` also restores a persisted session on cold start.
 *
 * `resolveProfile` ports the reference `src/context/AuthContext.jsx` chain:
 *   Firebase Auth user → `employees` (by email) → `TEAM_MEMBERS` → `users/{uid}`.
 * Every Firestore call is wrapped: security rules may deny a read/write for some
 * roles, and a denial must degrade to a usable profile, never block sign-in.
 */

import {
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  type User,
} from 'firebase/auth';
import { collection, doc, getDoc, getDocs, query, setDoc, where } from 'firebase/firestore';

import { getDb, getFirebaseAuth } from '@/lib/firebase';
import { tsToISO } from '@/lib/firestore/normalise';

import type { Session } from './mock-auth';
import { DEFAULT_NEPAL_ADMIN_PERMISSIONS, type PermissionOverrides } from './permissions';
import { ROLES, type Role } from './roles';
import { initialsFrom } from './session-shape';
import { findTeamMember } from './team-members';

const ROLE_SET = new Set<string>(ROLES);
function asRole(value: unknown): Role | null {
  return typeof value === 'string' && ROLE_SET.has(value) ? (value as Role) : null;
}

// ---- Auth actions ---------------------------------------------------------

export async function signIn(email: string, password: string): Promise<void> {
  // The Session is delivered by the `subscribe` listener once the profile resolves.
  await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
}

export async function requestPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(getFirebaseAuth(), email.trim());
}

export async function signOut(): Promise<void> {
  await fbSignOut(getFirebaseAuth());
}

/** Raw Firebase user stream. `real-auth.ts` combines it with the Supabase one. */
export function subscribeUser(onUser: (user: User | null) => void): () => void {
  return onAuthStateChanged(getFirebaseAuth(), onUser);
}

// ---- Profile resolution -------------------------------------------------------

interface EmployeeDoc {
  name?: unknown;
  role?: unknown;
  appRole?: unknown;
  location?: unknown;
  status?: unknown;
}

interface UserDoc {
  name?: unknown;
  role?: unknown;
  jobRole?: unknown;
  location?: unknown;
  permissions?: PermissionOverrides;
  createdAt?: unknown;
}

/**
 * Per-user permission overrides the reference app seeds in `AuthContext.jsx`
 * for staff whose access doesn't fit their role. Ported so the same people keep
 * the same access here. Applied in-memory only — the Admin Panel
 * (`users/{uid}.permissions`) stays the persistent source of truth:
 *   - Anmol / Sarbagya: fill a single gap, never override an explicit Admin Panel value.
 *   - Sunam Deepa (accountant): force the finance/billing/sales/HR/attendance
 *     flags on — an earlier bulk demotion left explicit `false`s on her doc that
 *     a plain fallback can't clear.
 * (Anusha's former override is intentionally dropped — she has left.)
 */
function applyStaffOverrides(
  email: string,
  current: PermissionOverrides | undefined,
): PermissionOverrides | undefined {
  const fillGap = (patch: PermissionOverrides): PermissionOverrides => {
    const next: PermissionOverrides = { ...(current ?? {}) };
    for (const [key, value] of Object.entries(patch)) {
      if (next[key as keyof PermissionOverrides] === undefined) {
        (next as Record<string, unknown>)[key] = value;
      }
    }
    return next;
  };

  switch (email) {
    case 'basnetanamol21@gmail.com':
      return fillGap({ production: true });
    case 'sarbagyakarkig8@gmail.com':
      return fillGap({ marketing: true });
    case 'deepasunam581@gmail.com': {
      const currentFinance =
        current?.finance && typeof current.finance === 'object' ? current.finance : {};
      const defaultFinance =
        DEFAULT_NEPAL_ADMIN_PERMISSIONS.finance && typeof DEFAULT_NEPAL_ADMIN_PERMISSIONS.finance === 'object'
          ? DEFAULT_NEPAL_ADMIN_PERMISSIONS.finance
          : {};
      return {
        ...(current ?? {}),
        finance: { ...defaultFinance, ...currentFinance },
        billing: true,
        accounting: true,
        sales: true,
        'employees-hr': true,
        attendance: true,
      };
    }
    default:
      return current;
  }
}

export async function resolveProfile(user: User): Promise<Session> {
  const email = (user.email ?? '').toLowerCase();
  const uid = user.uid;
  const db = getDb();

  // 1. employees, matched by email — source of truth for `status`.
  let employee: EmployeeDoc | null = null;
  try {
    const snap = await getDocs(query(collection(db, 'employees'), where('email', '==', email)));
    if (!snap.empty) employee = snap.docs[0].data() as EmployeeDoc;
  } catch (err) {
    console.warn('[auth] employees lookup denied/failed', err);
  }

  // 2. hard-coded known-staff fallback.
  const team = findTeamMember(email);

  // 3. users/{uid} — carries permission overrides + createdAt.
  let userDoc: UserDoc | null = null;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) userDoc = snap.data() as UserDoc;
  } catch (err) {
    console.warn('[auth] users/{uid} read denied/failed', err);
  }

  const name =
    (typeof employee?.name === 'string' && employee.name.trim()) ||
    team?.name ||
    (typeof userDoc?.name === 'string' && userDoc.name.trim()) ||
    user.displayName ||
    email ||
    'User';

  const status: 'Active' | 'Inactive' = employee?.status === 'Inactive' ? 'Inactive' : 'Active';

  // admin@kazi.com is always super_admin (lock-out failsafe, ported from reference).
  const appRole: Role =
    email === 'admin@kazi.com'
      ? 'super_admin'
      : team?.appRole ?? asRole(employee?.appRole) ?? asRole(userDoc?.role) ?? 'employee';

  const jobRole =
    (typeof employee?.role === 'string' && employee.role) ||
    team?.role ||
    (typeof userDoc?.jobRole === 'string' && userDoc.jobRole) ||
    '';

  const location: 'nepal' | 'uk' =
    employee?.location === 'uk' || team?.location === 'uk' || userDoc?.location === 'uk'
      ? 'uk'
      : 'nepal';

  // Permissions come from Postgres: the person's POSITION decides what they
  // see, via `position_permissions`. The local rules below are only a fallback
  // for when Supabase can't be reached — and even then they are advisory,
  // since RLS is what actually allows or refuses every read and write.


  let permissions: PermissionOverrides | undefined;
  {
    permissions = userDoc?.permissions;
    if (!permissions && appRole === 'nepal_admin') permissions = DEFAULT_NEPAL_ADMIN_PERMISSIONS;
    permissions = applyStaffOverrides(email, permissions);
  }

  const createdAt = tsToISO(userDoc?.createdAt) || undefined;

  // 4. best-effort self-heal of the profile doc — a denied write must not block sign-in.
  try {
    await setDoc(
      doc(db, 'users', uid),
      { uid, name, email, role: appRole, jobRole, location },
      { merge: true },
    );
  } catch (err) {
    console.warn('[auth] users/{uid} self-heal write denied/failed', err);
  }

  return {
    email,
    name,
    initials: initialsFrom(name, email),
    role: jobRole,
    appRole,
    jobRole,
    permissions,
    uid,
    location,
    status,
    createdAt,
  };
}
