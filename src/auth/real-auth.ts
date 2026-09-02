/**
 * The real (non-mock) auth implementation: one session, two possible sources.
 *
 * **Why two.** Postgres only verifies tokens signed with the project's own key,
 * so a Supabase Auth session is the one that makes live data work. But only 3
 * of 11 staff have set a Supabase password so far, and the rest still have
 * working Firebase logins — cutting Firebase off would lock them out. So both
 * listeners run, and a Supabase session always wins when both exist.
 *
 * Consequences worth knowing:
 *   - Signed in via Supabase → `me()` decides identity and permissions, RLS
 *     lets the reads through, screens show live data.
 *   - Signed in via Firebase only → every Postgres request is rejected
 *     (`PGRST301`), so permissions come from the legacy Firestore chain and
 *     every screen shows a read error telling them to set a password
 *     (see `lastTokenSource` in `src/lib/supabase.ts`).
 *
 * Sign-in tries Supabase first and falls through to Firebase, so a person who
 * has set a password is silently upgraded to the working path.
 */

import type { User } from 'firebase/auth';

import { isFirebaseConfigured } from '@/lib/firebase';
import { isSupabaseConfigured } from '@/lib/supabase';

import * as firebase from './firebase-auth';
import type { Session } from './mock-auth';
import type { Role } from './roles';
import { minimalSession, sessionFromIdentity } from './session-shape';
import * as supabase from './supabase-auth';
import { fetchIdentityResult } from './supabase-profile';

/** True when at least one real session source is wired up. */
export const isRealAuthConfigured = isFirebaseConfigured || isSupabaseConfigured;

// ---- Auth actions ---------------------------------------------------------

/**
 * Supabase first, Firebase second. Both deliver the Session through the
 * subscription rather than returning it, so the caller gets null either way.
 *
 * The thrown error is whichever backend spoke last, and both map to the same
 * "incorrect email or password" copy — so a failed sign-in never reveals which
 * system an address exists in.
 */
export async function signIn(email: string, password: string): Promise<Session | null> {
  const trimmed = email.trim();
  let firstError: unknown = null;

  if (isSupabaseConfigured) {
    try {
      await supabase.signIn(trimmed, password);
      return null;
    } catch (err) {
      firstError = err;
    }
  }

  if (isFirebaseConfigured) {
    await firebase.signIn(trimmed, password);
    return null;
  }

  throw firstError ?? new Error('No auth backend is configured.');
}

/**
 * Supabase owns password reset: its recovery mail is how staff without a
 * Supabase password get one, which is what moves them onto the working path.
 * Firebase is only used if Supabase itself is unreachable.
 */
export async function requestPasswordReset(email: string): Promise<void> {
  if (isSupabaseConfigured) {
    try {
      await supabase.requestPasswordReset(email);
      return;
    } catch (err) {
      if (!isFirebaseConfigured) throw err;
      console.warn('[auth] Supabase password reset failed — trying Firebase', err);
    }
  }
  await firebase.requestPasswordReset(email);
}

export async function signOut(): Promise<void> {
  const results = await Promise.allSettled([
    isSupabaseConfigured ? supabase.signOut() : Promise.resolve(),
    isFirebaseConfigured ? firebase.signOut() : Promise.resolve(),
  ]);
  // Only complain if BOTH failed; one backend already being signed out is normal.
  const failures = results.filter((r) => r.status === 'rejected');
  if (failures.length === results.length) {
    throw (failures[0] as PromiseRejectedResult).reason;
  }
}

/** Real auth has no dev role switch — the switcher is hidden when it is configured. */
export async function setDevRole(_role?: Role): Promise<Session | null> {
  return null;
}

// ---- Session resolution ---------------------------------------------------

async function resolveSession(
  sb: supabase.SbSession | null,
  fb: User | null,
): Promise<Session | null> {
  if (sb) {
    const result = await fetchIdentityResult();
    if (result.ok && result.identity) {
      return sessionFromIdentity(result.identity, {
        // Older rows key off the Firebase uid, so prefer it when we have both.
        uid: fb?.uid ?? sb.user.id,
        email: sb.user.email,
        displayName: fb?.displayName,
      });
    }
    if (result.ok) {
      // The token is valid but resolves to no active person. Holding on to it
      // would bounce the app between login and dashboard, so drop it.
      console.warn('[auth] this Supabase account matches no active person — signing it out');
      if (!fb) {
        await supabase.signOut().catch(() => {});
        return null;
      }
    } else {
      // Never read a network failure as "no access" — fall through to Firebase
      // and let the person keep working against whatever it can resolve.
      console.warn('[auth] identity lookup failed — falling back', result.error);
      if (!fb) return null;
    }
  }

  if (!fb) return null;
  return firebase.resolveProfile(fb);
}

/**
 * One Session out of two independent listeners.
 *
 * Two things this has to get right:
 *   - **Never emit before both sources have reported.** Firebase resolves
 *     first on a cold start; emitting its null would flash the login screen at
 *     someone whose Supabase session is still being read out of AsyncStorage.
 *   - **Never let a slow resolve overwrite a newer one.** Each emit takes a
 *     generation and only delivers if it is still the latest, so a sign-out
 *     racing an in-flight profile fetch can't be undone by it.
 */
export function subscribe(onSession: (session: Session | null) => void): () => void {
  let generation = 0;
  let disposed = false;

  let fbUser: User | null = null;
  let sbSession: supabase.SbSession | null = null;
  let fbReady = !isFirebaseConfigured;
  let sbReady = !isSupabaseConfigured;

  const emit = () => {
    if (disposed || !fbReady || !sbReady) return;
    const gen = ++generation;
    const deliver = (session: Session | null) => {
      if (!disposed && gen === generation) onSession(session);
    };

    if (!sbSession && !fbUser) {
      deliver(null);
      return;
    }
    resolveSession(sbSession, fbUser).then(deliver, (err) => {
      console.warn('[auth] profile resolve failed — using a minimal session', err);
      deliver(fbUser ? minimalSession(fbUser) : null);
    });
  };

  // If a backend never reports — a wedged AsyncStorage read, an SDK quirk —
  // `emit` would never run and the app would sit on the splash screen forever.
  // Better to continue with whatever did report than to hang.
  const watchdog = setTimeout(() => {
    if (fbReady && sbReady) return;
    console.warn('[auth] a session source never reported — continuing without it');
    fbReady = true;
    sbReady = true;
    emit();
  }, 8000);

  const unsubFb = isFirebaseConfigured
    ? firebase.subscribeUser((user) => {
        fbUser = user;
        fbReady = true;
        emit();
      })
    : null;

  const unsubSb = isSupabaseConfigured
    ? supabase.subscribe((session) => {
        sbSession = session;
        sbReady = true;
        emit();
      })
    : null;

  return () => {
    disposed = true;
    clearTimeout(watchdog);
    unsubFb?.();
    unsubSb?.();
  };
}
