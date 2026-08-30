import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { useAuth } from '@/auth/auth-context';

import { markOneRead, markRead, subscribeNotifications } from './firestore';
import type { NotificationRecord } from './types';

interface NotificationsValue {
  records: NotificationRecord[];
  loading: boolean;
  error: boolean;
  unreadCount: number;
  markAllRead: () => void;
  markReadById: (id: string) => void;
}

const NotificationsContext = createContext<NotificationsValue | null>(null);

/**
 * Holds the single `mobile_notifications` snapshot for the signed-in user, so
 * the bell badge and the Notifications screen share one listener. Mounted once,
 * inside `AuthProvider`.
 */
export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const email = profile?.email ?? '';

  const [records, setRecords] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!email) {
      setRecords([]);
      setLoading(false);
      setError(false);
      return;
    }
    setLoading(true);
    const unsub = subscribeNotifications(
      email,
      (recs) => {
        setRecords(recs);
        setLoading(false);
        setError(false);
      },
      () => {
        setError(true);
        setLoading(false);
      },
    );
    return unsub;
  }, [email]);

  const unreadCount = useMemo(() => records.reduce((n, r) => (r.read ? n : n + 1), 0), [records]);

  const markAllRead = useCallback(() => {
    setRecords((prev) => {
      const ids = prev.filter((r) => !r.read).map((r) => r.id);
      if (ids.length) void markRead(ids);
      return prev.map((r) => (r.read ? r : { ...r, read: true }));
    });
  }, []);

  const markReadById = useCallback((id: string) => {
    setRecords((prev) => prev.map((r) => (r.id === id ? { ...r, read: true } : r)));
    void markOneRead(id);
  }, []);

  const value = useMemo<NotificationsValue>(
    () => ({ records, loading, error, unreadCount, markAllRead, markReadById }),
    [records, loading, error, unreadCount, markAllRead, markReadById],
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications(): NotificationsValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within a NotificationsProvider');
  return ctx;
}

export function useUnreadCount(): number {
  return useNotifications().unreadCount;
}
