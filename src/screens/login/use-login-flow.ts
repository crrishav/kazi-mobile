import { useCallback, useState } from 'react';

import { useAuth } from '@/auth/auth-context';

export type LoginView = 'signin' | 'forgot' | 'sent';

/** Ports the prototype's signin/forgot/sent state machine onto real auth calls — Stack.Protected redirects to (app) once signIn() resolves. */
export function useLoginFlow() {
  const { signIn, requestPasswordReset } = useAuth();
  const [view, setView] = useState<LoginView>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const goSignin = useCallback(() => {
    setView('signin');
    setError(null);
  }, []);

  const goForgot = useCallback(() => {
    setView('forgot');
    setError(null);
  }, []);

  const submitSignin = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      await signIn(email.trim() || 'sita@kazi.com.np', password);
    } catch {
      setError('Could not sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [email, password, loading, signIn]);

  const submitReset = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      await requestPasswordReset(email.trim() || 'sita@kazi.com.np');
      setView('sent');
    } finally {
      setLoading(false);
    }
  }, [email, loading, requestPasswordReset]);

  return {
    view,
    email,
    setEmail,
    password,
    setPassword,
    loading,
    error,
    emailShown: email.trim() || 'sita@kazi.com.np',
    goSignin,
    goForgot,
    submitSignin,
    submitReset,
  };
}
