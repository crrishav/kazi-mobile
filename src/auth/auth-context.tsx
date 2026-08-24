import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

import * as mockAuth from './mock-auth';
import type { Session } from './mock-auth';

interface AuthContextValue {
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    mockAuth.getSession().then((s) => {
      setSession(s);
      setIsLoading(false);
    });
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const s = await mockAuth.signIn(email, password);
    setSession(s);
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    await mockAuth.requestPasswordReset(email);
  }, []);

  const signOut = useCallback(async () => {
    await mockAuth.signOut();
    setSession(null);
  }, []);

  return (
    <AuthContext.Provider value={{ session, isLoading, signIn, requestPasswordReset, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
