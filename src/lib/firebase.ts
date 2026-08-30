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

import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import {
  initializeFirestore,
  memoryLocalCache,
  persistentLocalCache,
  type Firestore,
} from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';

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
 * Firestore with offline persistence (the `expo-data-fetching` skill's offline
 * requirement). Falls back to an in-memory cache if the platform can't back
 * `persistentLocalCache` (bare React Native has no IndexedDB — a dev build with
 * the right polyfill, or `@react-native-firebase`, is the eventual answer).
 */
export function getDb(): Firestore {
  assertConfigured();
  if (!dbRef) {
    try {
      dbRef = initializeFirestore(getFirebaseApp(), { localCache: persistentLocalCache() });
    } catch {
      dbRef = initializeFirestore(getFirebaseApp(), { localCache: memoryLocalCache() });
    }
  }
  return dbRef;
}

export function getFirebaseAuth(): Auth {
  assertConfigured();
  if (!authRef) authRef = getAuth(getFirebaseApp());
  return authRef;
}
