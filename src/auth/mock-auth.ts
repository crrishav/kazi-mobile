import AsyncStorage from '@react-native-async-storage/async-storage';

import { simulateLatency } from '@/data/mock/delay';

// Explicitly namespaced "mock-*" key: this is a placeholder session store,
// not real credential storage. Swap for expo-secure-store + Firebase Auth
// once a real backend is wired up — nothing else in the app should need to
// change, since callers only see signIn/signOut/getSession below.
const SESSION_KEY = 'mock-auth-session';

export interface Session {
  email: string;
  name: string;
  initials: string;
  role: string;
}

function deriveName(email: string): { name: string; initials: string } {
  const local = email.split('@')[0] ?? 'User';
  const parts = local.split(/[.\-_]/).filter(Boolean);
  const name = parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ') || 'Sita Rai';
  const initials = parts
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join('') || 'SR';
  return { name, initials };
}

export async function getSession(): Promise<Session | null> {
  const raw = await AsyncStorage.getItem(SESSION_KEY);
  return raw ? (JSON.parse(raw) as Session) : null;
}

export async function signIn(email: string, _password: string): Promise<Session> {
  await simulateLatency(1200);
  const { name, initials } = deriveName(email.trim() || 'sita@kazi.com.np');
  const session: Session = { email, name, initials, role: 'Floor supervisor · Line 3' };
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export async function requestPasswordReset(_email: string): Promise<void> {
  await simulateLatency(1200);
}

export async function signOut(): Promise<void> {
  await AsyncStorage.removeItem(SESSION_KEY);
}
