import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { asCompactCurrency, asCurrency, moneyParts, toGBP, type Currency, type MoneyParts } from './currency';

// Namespaced key — a UI preference, not credentials. Safe in AsyncStorage.
const PRIMARY_CURRENCY_KEY = 'kazi-primary-currency';

interface CurrencyContextValue {
  /** The currency the user wants amounts shown in first. Defaults to NPR. */
  primary: Currency;
  /** The other currency, shown muted alongside `primary`. */
  secondary: Currency;
  /** False until the persisted preference has loaded — screens can ignore this and render NPR-first meanwhile. */
  ready: boolean;
  setPrimary: (cur: Currency) => void;
  toggle: () => void;
  /** Format an NPR amount in the user's preferred currency. */
  format: (npr: number, opts?: { compact?: boolean }) => string;
  /** Both display strings for an NPR amount: `{ primary, secondary }`. */
  parts: (npr: number, opts?: { compact?: boolean }) => MoneyParts;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [primary, setPrimaryState] = useState<Currency>('NPR');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(PRIMARY_CURRENCY_KEY)
      .then((raw) => {
        if (raw === 'NPR' || raw === 'GBP') setPrimaryState(raw);
      })
      .finally(() => setReady(true));
  }, []);

  const setPrimary = useCallback((cur: Currency) => {
    setPrimaryState(cur);
    void AsyncStorage.setItem(PRIMARY_CURRENCY_KEY, cur);
  }, []);

  const toggle = useCallback(() => {
    setPrimaryState((prev) => {
      const next: Currency = prev === 'NPR' ? 'GBP' : 'NPR';
      void AsyncStorage.setItem(PRIMARY_CURRENCY_KEY, next);
      return next;
    });
  }, []);

  const value = useMemo<CurrencyContextValue>(
    () => ({
      primary,
      secondary: primary === 'NPR' ? 'GBP' : 'NPR',
      ready,
      setPrimary,
      toggle,
      format: (npr, opts) =>
        primary === 'GBP'
          ? (opts?.compact ? asCompactCurrency : asCurrency)(toGBP(npr), 'GBP')
          : (opts?.compact ? asCompactCurrency : asCurrency)(npr, 'NPR'),
      parts: (npr, opts) => moneyParts(npr, primary, opts?.compact),
    }),
    [primary, ready, setPrimary, toggle],
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within a CurrencyProvider');
  return ctx;
}
