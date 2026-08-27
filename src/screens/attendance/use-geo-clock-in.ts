import { useCallback, useRef, useState } from 'react';
import * as Location from 'expo-location';

import { evaluateGeofence, type GeofenceEval } from '@/lib/geo';

export type GeoState = 'idle' | 'locating' | 'ready' | 'denied' | 'error';

export interface GeoCoords {
  lat: number;
  lng: number;
  accuracyM: number;
}

export interface LocateResult {
  /** Inside the geofence AND accurate enough — safe to clock in without a prompt. */
  ok: boolean;
  coords: GeoCoords | null;
  geo: GeofenceEval | null;
  reason: GeoState;
}

/**
 * GPS acquisition + geofence check for the clock-in card (plan §2.6, item 26).
 * Wraps `expo-location`: request permission, take one fix, evaluate it against
 * `WORK_SITE`. Callers proceed automatically on `ok`, or offer a manual
 * "clock in anyway" bypass otherwise (mirrors the reference `ClockInCard`).
 */
export function useGeoClockIn() {
  const [state, setState] = useState<GeoState>('idle');
  const [geo, setGeo] = useState<GeofenceEval | null>(null);
  const coordsRef = useRef<GeoCoords | null>(null);

  const reset = useCallback(() => {
    setState('idle');
    setGeo(null);
    coordsRef.current = null;
  }, []);

  const locate = useCallback(async (): Promise<LocateResult> => {
    setState('locating');
    setGeo(null);
    coordsRef.current = null;
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setState('denied');
        return { ok: false, coords: null, geo: null, reason: 'denied' };
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const coords: GeoCoords = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracyM: pos.coords.accuracy ?? Number.POSITIVE_INFINITY,
      };
      coordsRef.current = coords;
      const ev = evaluateGeofence(coords.lat, coords.lng, coords.accuracyM);
      setGeo(ev);
      setState('ready');
      return { ok: ev.withinFence && ev.accuracyOk, coords, geo: ev, reason: 'ready' };
    } catch {
      setState('error');
      return { ok: false, coords: null, geo: null, reason: 'error' };
    }
  }, []);

  return { state, geo, coordsRef, locate, reset };
}
