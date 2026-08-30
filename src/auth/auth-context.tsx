import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { setActor } from '@/data/notifications/actor';
import { isFirebaseConfigured } from '@/lib/firebase';

import * as firebaseAuth from './firebase-auth';
import * as mockAuth from './mock-auth';
import type { Session } from './mock-auth';
import {
  financeTabAllowed,
  sectionCanEdit,
  sectionVisible,
  type FinanceTabId,
  type Profile,
  type SectionId,
} from './permissions';
import type { Role } from './roles';

interface AuthContextValue {
  session: Session | null;
  /** RBAC view of the session (reference `profile`). Null when signed out. */
  profile: Profile | null;
  role: Role | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  /** Dev-only role switch (no real auth yet) — see More › Role. */
  setDevRole: (role: Role) => Promise<void>;
  /** Section shown in nav for the current profile. */
  canView: (section: SectionId) => boolean;
  /** Current profile may create/edit/delete in this section. */
  can: (section: SectionId) => boolean;
  /** One Finance sub-tab is available. */
  financeTab: (tab: FinanceTabId) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Real Firebase Auth when configured (§2.2); the in-memory mock otherwise. */
const impl = isFirebaseConfigured ? firebaseAuth : mockAuth;

function toProfile(session: Session | null): Profile | null {
  if (!session) return null;
  return {
    email: session.email,
    name: session.name,
    initials: session.initials,
    role: session.appRole,
    jobRole: session.jobRole ?? session.role,
    permissions: session.permissions,
    uid: session.uid,
    location: session.location,
    status: session.status,
    createdAt: session.createdAt,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isFirebaseConfigured) {
      // onAuthStateChanged fires once on cold start (restoring a persisted
      // session) and on every sign-in / sign-out thereafter.
      return firebaseAuth.subscribe((s) => {
        setSession(s);
        setIsLoading(false);
      });
    }
    mockAuth.getSession().then((s) => {
      setSession(s);
      setIsLoading(false);
    });
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    // Mock returns the Session directly; Firebase delivers it via the subscription.
    const next = await impl.signIn(email, password);
    if (next) setSession(next);
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    await impl.requestPasswordReset(email);
  }, []);

  const signOut = useCallback(async () => {
    await impl.signOut();
    setSession(null);
  }, []);

  const setDevRole = useCallback(async (role: Role) => {
    const next = await impl.setDevRole(role);
    if (next) setSession(next);
  }, []);

  // Keep the notifications module's "who am I" in sync so mutation hooks can
  // attribute events without prop-drilling the current user.
  useEffect(() => {
    setActor(session ? { name: session.name, email: session.email, role: session.appRole } : null);
  }, [session]);

  const profile = useMemo(() => toProfile(session), [session]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      profile,
      role: profile?.role ?? null,
      isLoading,
      signIn,
      requestPasswordReset,
      signOut,
      setDevRole,
      canView: (section) => sectionVisible(profile, section),
      can: (section) => sectionCanEdit(profile, section),
      financeTab: (tab) => financeTabAllowed(profile, tab),
    }),
    [session, profile, isLoading, signIn, requestPasswordReset, signOut, setDevRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
