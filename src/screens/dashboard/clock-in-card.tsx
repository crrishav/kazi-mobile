import { useEffect, useState } from 'react';

import { useAuth } from '@/auth/auth-context';
import { useToast } from '@/components/toast/toast-provider';
import { useClockStatus, useToggleClock } from '@/data/attendance/hooks';
import { DEFAULT_CLOCK_STATUS, MY_NAME } from '@/data/attendance/mock';

import { ClockCard } from '@/screens/attendance/clock-card';
import { useGeoClockIn } from '@/screens/attendance/use-geo-clock-in';

/**
 * Self-contained clock in / out card for the dashboard — same `ClockCard` and
 * GPS-geofenced wiring as the Attendance "Mine" view, so people who punch a
 * clock can do it without leaving the home screen. Renders nothing for admins
 * (see `Dashboard`, which gates on role before mounting this).
 */
export function DashboardClockInCard() {
  const toast = useToast();
  const { profile } = useAuth();
  const staffName = profile?.name ?? MY_NAME;

  const { data: clockStatus } = useClockStatus();
  const toggleClock = useToggleClock();
  const geoClock = useGeoClockIn();

  const [elapsed, setElapsed] = useState(DEFAULT_CLOCK_STATUS.elapsedSeconds);
  const [hasSynced, setHasSynced] = useState(false);

  useEffect(() => {
    if (clockStatus && !hasSynced) {
      setElapsed(clockStatus.elapsedSeconds);
      setHasSynced(true);
    }
  }, [clockStatus, hasSynced]);

  useEffect(() => {
    if (!clockStatus?.clockedIn) return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [clockStatus?.clockedIn]);

  if (!clockStatus) return null;

  // GPS geofenced clock-in — take a fix, verify against WORK_SITE, then punch.
  const finishClockIn = async (
    coords: { lat: number; lng: number; accuracyM: number } | null,
    bypassUsed: boolean,
  ) => {
    const next = await toggleClock.mutateAsync({ elapsedSeconds: elapsed, staffName, coords, bypassUsed });
    geoClock.reset();
    const p = next.lastPunch;
    if (!p) return;
    if (p.status === 'Late') {
      toast.show({
        message: `Clocked in · ${p.lateMinutes} min late${p.lateCutApplied ? ' · salary cut applied' : ''}`,
        tone: p.lateCutApplied ? 'warn' : 'ok',
      });
    } else if (bypassUsed) {
      toast.show({ message: 'Clocked in · geofence bypassed, flagged for review', tone: 'warn' });
    } else {
      toast.show({ message: 'Clocked in · at the workshop, on time', tone: 'ok' });
    }
  };

  const handleToggleClock = async () => {
    if (clockStatus.clockedIn) {
      await toggleClock.mutateAsync({ elapsedSeconds: elapsed, staffName, coords: null, bypassUsed: false });
      geoClock.reset();
      return;
    }
    const res = await geoClock.locate();
    if (res.ok && res.coords) {
      await finishClockIn(res.coords, false);
    }
    // otherwise the clock card shows the blocked banner + "Clock in anyway"
  };

  const handleBypassClockIn = () => {
    void finishClockIn(geoClock.coordsRef.current, true);
  };

  return (
    <ClockCard
      clockedIn={clockStatus.clockedIn}
      inTime={clockStatus.inTime}
      outTime={clockStatus.outTime}
      elapsedSeconds={elapsed}
      onToggle={handleToggleClock}
      geoState={geoClock.state}
      geo={geoClock.geo}
      lastPunch={clockStatus.lastPunch}
      onBypass={handleBypassClockIn}
      onOpenSettings={geoClock.openSettings}
    />
  );
}
