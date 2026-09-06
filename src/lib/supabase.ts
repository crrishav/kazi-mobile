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
 * Decode a JWT's claims without verifying it — diagnosis only, never a
 * decision. Returns `null` for anything that isn't a readable JWT.
 */
function claimsOf(token: string): Record<string, unknown> | null {
  try {
    const body = token.split('.')[1];
    if (!body) return null;
    const padded = body.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(body.length / 4) * 4, '=');
    return JSON.parse(globalThis.atob(padded)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Say — once per distinct token, in dev only — exactly who the data client is
 * signing requests as.
 *
 * Every failure mode this wiring has ever had looks identical from a screen:
 * a wall of `PGRST301 "No suitable key or wrong key type"` with nothing naming
 * the cause. The cause is always in the token, so print it: a Firebase `iss`
 * means Postgres will reject every request no matter how many times the person
 * signs in, and no token at all means the request went out as `anon`.
 */
let announced = '';
function announce(source: TokenSource, token: string | null): void {
  if (!__DEV__) return;
  const claims = token ? claimsOf(token) : null;
  const who = claims ? String(claims.email ?? claims.sub ?? 'an unnamed subject') : token ? 'an undecodable token' : 'anonymous';
  const key = `${source}:${who}`;
  if (announced === key) return;
  announced = key;

  if (source === 'supabase') {
    const exp = typeof claims?.exp === 'number' ? new Date(claims.exp * 1000).toISOString() : 'unknown';
    console.log(`[supabase] signing data requests as ${who} (Supabase session, expires ${exp})`);
  } else if (source === 'firebase') {
    console.warn(
      `[supabase] signing data requests with a FIREBASE token for ${who}. Postgres cannot ` +
        'verify it — the project JWKS holds only Supabase’s own key — so every read and ' +
        'write below will fail with PGRST301. This is a session left over from before the ' +
        'Supabase swap: sign out and sign in again to trade it for one that works. If the ' +
        'sign-in itself fails, the account has no Supabase password yet — "Forgot password?".',
    );
  } else {
    console.warn('[supabase] no session — data requests go out as the anon role and will see almost nothing.');
  }
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
      announce('supabase', data.session.access_token);
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
        const token = await user.getIdToken();
        announce('firebase', token);
        return token;
      }
    } catch {
      // fall through to anonymous
    }
  }

  tokenSource = null;
  announce(null, null);
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
