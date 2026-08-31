/**
 * Firebase client scaffold (Track B — FRONTEND_GAP_PLAN §2.1).
 *
 * **Inert until configured.** Nothing here runs at import time; the app keeps
 * using the in-memory `mock-api.ts` layer. When the user supplies the
 * `kazi-manufacturing` **Web SDK** config as `EXPO_PUBLIC_FIREBASE_*` env vars
 * (via `app.json` `extra` / EAS secrets), `isFirebaseConfigured` flips true and
 * `getDb()` / `getFirebaseAuth()` start returning live handles.
 *
 * The service-account `key.json` is for read-only schema inspection only and is
 * never imported here — the client authenticates with the public Web config.
 */

import { Platform } from 'react-native';

import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import {
  initializeFirestore,
  memoryLocalCache,
  persistentLocalCache,
  type Firestore,
} from 'firebase/firestore';
import { getAuth, initializeAuth, type Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
} as const;

/** True once the minimum Web SDK keys are present in the environment. */
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId,
);

let appRef: FirebaseApp | null = null;
let dbRef: Firestore | null = null;
let authRef: Auth | null = null;

function assertConfigured(): void {
  if (!isFirebaseConfigured) {
    throw new Error(
      'Firebase is not configured — set EXPO_PUBLIC_FIREBASE_* before calling getDb()/getFirebaseAuth().',
    );
  }
}

export function getFirebaseApp(): FirebaseApp {
  assertConfigured();
  if (!appRef) {
    appRef = getApps().length ? getApp() : initializeApp(firebaseConfig as Record<string, string>);
  }
  return appRef;
}

/**
 * Firestore with offline persistence on web (the `expo-data-fetching` skill's
 * offline requirement) and an in-memory cache on native.
 *
 * `persistentLocalCache` needs IndexedDB. Browsers have it; bare React Native
 * (Expo Go, or a dev build with no polyfill) does not — and the SDK only finds
 * that out asynchronously on first use, logging a noisy "missing IndexedDB /
 * persistence disabled" fallback warning. So the cache is chosen by platform up
 * front rather than left to fail over. A dev build with the right polyfill, or
 * `@react-native-firebase`, is the eventual answer for native persistence.
 */
export function getDb(): Firestore {
  assertConfigured();
  if (!dbRef) {
    const localCache = Platform.OS === 'web' ? persistentLocalCache() : memoryLocalCache();
    dbRef = initializeFirestore(getFirebaseApp(), { localCache });
  }
  return dbRef;
}

/**
 * Auth with a session that survives an app restart.
 *
 * The `firebase/auth` umbrella entry (v12) has no `react-native` export
 * condition, so it does NOT wire persistence for us. We pull
 * `getReactNativePersistence` from the underlying `@firebase/auth` package (its
 * `react-native` build does export it) and back it with AsyncStorage. Done via
 * `require` so TypeScript resolves against the umbrella types only; every step
 * is guarded and falls back to a plain `getAuth` (in-memory session) so a
 * resolution quirk can never hard-crash sign-in. `getAuth` is also the
 * fast-refresh path once `initializeAuth` has run for this app instance.
 */
export function getFirebaseAuth(): Auth {
  assertConfigured();
  if (authRef) return authRef;
  const app = getFirebaseApp();
  try {
    const rnAuth = require('@firebase/auth') as {
      getReactNativePersistence?: (storage: unknown) => unknown;
    };
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    authRef = rnAuth.getReactNativePersistence
      ? initializeAuth(app, { persistence: rnAuth.getReactNativePersistence(AsyncStorage) as never })
      : initializeAuth(app);
  } catch {
    authRef = getAuth(app);
  }
  return authRef;
}
