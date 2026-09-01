/**
 * Supabase client — the app's data backend, replacing Firestore.
 *
 * Auth is NOT Supabase Auth. Staff keep their existing Firebase logins, and
 * Supabase is configured to trust Firebase as a third-party issuer, so the
 * client hands it the Firebase ID token on every request (`accessToken`
 * below). Postgres RLS resolves that token's `sub` to a `people` row via
 * `legacy_firebase_uid` and derives every permission from the person's
 * position. See supabase/migrations/0009_firebase_third_party_auth.sql.
 *
 * Consequences worth knowing:
 *   - There is no `supabase.auth.signIn`; Firebase owns the session.
 *   - A signed-in Firebase user with no `people` row reads nothing at all.
 *     That is deliberate — dropped staff keep their login but lose access.
 *   - `isSupabaseConfigured` gates the whole live path; unconfigured, every
 *     module falls back to its in-memory mock exactly as before.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { getFirebaseAuth, isFirebaseConfigured } from '@/lib/firebase';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

let clientRef: SupabaseClient | null = null;

/**
 * The current Firebase ID token, or null when nobody is signed in.
 * `getIdToken()` refreshes automatically when the cached token is near expiry,
 * which is also how a freshly-set custom claim reaches Postgres.
 */
async function firebaseAccessToken(): Promise<string | null> {
  if (!isFirebaseConfigured) return null;
  try {
    const user = getFirebaseAuth().currentUser;
    if (!user) return null;
    return await user.getIdToken();
  } catch {
    return null;
  }
}

export function getSupabase(): SupabaseClient {
  if (!isSupabaseConfigured) {
    throw new Error(
      'Supabase is not configured — set EXPO_PUBLIC_SUPABASE_URL and ' +
        'EXPO_PUBLIC_SUPABASE_ANON_KEY. Callers should check `isSupabaseConfigured` first.',
    );
  }
  if (clientRef) return clientRef;
  clientRef = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    accessToken: firebaseAccessToken,
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: { 'x-client-info': 'kazi-mobile' } },
  });
  return clientRef;
}
