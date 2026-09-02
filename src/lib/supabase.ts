/**
 * Supabase clients — the app's data backend, replacing Firestore.
 *
 * **Two clients, deliberately.** supabase-js cannot do both jobs on one
 * instance: passing the `accessToken` option makes the whole `.auth` namespace
 * throw ("Not supported in this environment"). So we keep them apart, exactly
 * as the web app does (`jenithroy/kazi-app`, branch
 * `migrate/firestore-to-supabase`, `src/supabase.js`):
 *
 *   - `getSupabaseAuth()` — Supabase Auth only. Owns the session: sign-in,
 *     password reset, refresh, AsyncStorage persistence. Never used to query.
 *   - `getSupabase()` — the data client. Every request carries whatever
 *     `currentAccessToken()` returns.
 *
 * **Why not Firebase tokens.** The project's JWKS holds only Supabase's own
 * signing key; Firebase was never registered as a Third-Party Auth provider,
 * so a Firebase ID token comes back `401 PGRST301 "No suitable key was found
 * to decode the JWT"` on every single read and write. `currentAccessToken`
 * therefore prefers the Supabase session and only offers the Firebase token as
 * a last resort — harmless if the provider is ever registered, and the reason
 * a Firebase-only account still sees no live data today.
 *
 * Postgres RLS resolves the token to a `people` row (`app_person_id()` accepts
 * both a native uuid `sub` and a legacy Firebase uid) and derives every
 * permission from that person's position. A signed-in account with no `people`
 * row reads nothing at all — that is deliberate, so departed staff keep their
 * login but lose access.
 *
 * `isSupabaseConfigured` gates the whole live path; unconfigured, every module
 * falls back to its in-memory mock exactly as before.
 */

import { AppState } from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { getFirebaseAuth, isFirebaseConfigured } from '@/lib/firebase';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

function assertConfigured(): void {
  if (!isSupabaseConfigured) {
    throw new Error(
      'Supabase is not configured — set EXPO_PUBLIC_SUPABASE_URL and ' +
        'EXPO_PUBLIC_SUPABASE_ANON_KEY. Callers should check `isSupabaseConfigured` first.',
    );
  }
}

let authRef: SupabaseClient | null = null;
let dataRef: SupabaseClient | null = null;

/**
 * Which token the last data request carried. `'firebase'` is the diagnosis for
 * a whole app's worth of 401s at once — Postgres cannot verify that token — so
 * the read-error copy can tell the person the one thing that actually helps
 * (set a Supabase password) instead of "sign in again", which won't.
 */
export type TokenSource = 'supabase' | 'firebase' | null;
let tokenSource: TokenSource = null;
export function lastTokenSource(): TokenSource {
  return tokenSource;
}

/**
 * The session-owning client. Its own `storageKey` keeps it clear of anything
 * else in AsyncStorage, and `autoRefreshToken` is driven by AppState because
 * on native the refresh timer must stop while the app is backgrounded (the
 * documented React Native setup).
 */
export function getSupabaseAuth(): SupabaseClient {
  assertConfigured();
  if (authRef) return authRef;
  authRef = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    auth: {
      storage: AsyncStorage,
      storageKey: 'kazi-mobile-supabase-auth',
      persistSession: true,
      autoRefreshToken: true,
      // No URL to parse on native, and on web it would try to consume a hash
      // fragment expo-router owns.
      detectSessionInUrl: false,
    },
    global: { headers: { 'x-client-info': 'kazi-mobile' } },
  });

  AppState.addEventListener('change', (state) => {
    if (state === 'active') authRef?.auth.startAutoRefresh();
    else authRef?.auth.stopAutoRefresh();
  });
  if (AppState.currentState === 'active') authRef.auth.startAutoRefresh();

  return authRef;
}

/**
 * The token every data request is signed with: the Supabase session first (the
 * only one Postgres can verify), then a Firebase ID token, then nothing.
 *
 * `getSession()` refreshes on its own when the cached token has expired, and
 * `getIdToken()` does the same on the Firebase side, so neither branch can
 * hand back something stale.
 */
async function currentAccessToken(): Promise<string | null> {
  try {
    const { data } = await getSupabaseAuth().auth.getSession();
    if (data.session?.access_token) {
      tokenSource = 'supabase';
      return data.session.access_token;
    }
  } catch (err) {
    console.warn('[supabase] could not read the auth session', err);
  }

  if (isFirebaseConfigured) {
    try {
      const user = getFirebaseAuth().currentUser;
      if (user) {
        tokenSource = 'firebase';
        return await user.getIdToken();
      }
    } catch {
      // fall through to anonymous
    }
  }

  tokenSource = null;
  return null;
}

export function getSupabase(): SupabaseClient {
  assertConfigured();
  if (dataRef) return dataRef;
  dataRef = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    accessToken: currentAccessToken,
    global: { headers: { 'x-client-info': 'kazi-mobile' } },
  });
  return dataRef;
}
