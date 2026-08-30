import { StyleSheet, View } from 'react-native';

import { RiseIn } from '@/components/ui/rise-in';
import { MY_SUMMARY, WEEKLY_HOURS } from '@/data/attendance/mock';
import type { PunchSummary } from '@/data/attendance/types';
import type { GeofenceEval } from '@/lib/geo';

import { ClockCard } from './clock-card';
import { MonthCalendar } from './month-calendar';
import { MonthlySummary } from './monthly-summary';
import { WeeklyHours } from './weekly-hours';
import type { GeoState } from './use-geo-clock-in';

export interface MineViewProps {
  clockedIn: boolean;
  inTime: string;
  outTime: string | null;
  elapsedSeconds: number;
  onToggleClock: () => void;
  onRaiseCorrection: () => void;
  geoState: GeoState;
  geo: GeofenceEval | null;
  lastPunch?: PunchSummary;
  onBypassClockIn: () => void;
  onOpenSettings?: () => void;
}

export function MineView({
  clockedIn,
  inTime,
  outTime,
  elapsedSeconds,
  onToggleClock,
  onRaiseCorrection,
  geoState,
  geo,
  lastPunch,
  onBypassClockIn,
  onOpenSettings,
}: MineViewProps) {
  return (
    <RiseIn viewKey="mine">
      <View style={styles.wrap}>
        <ClockCard
          clockedIn={clockedIn}
          inTime={inTime}
          outTime={outTime}
          elapsedSeconds={elapsedSeconds}
          onToggle={onToggleClock}
          geoState={geoState}
          geo={geo}
          lastPunch={lastPunch}
          onBypass={onBypassClockIn}
          onOpenSettings={onOpenSettings}
        />
        <MonthCalendar />
        <WeeklyHours weeks={WEEKLY_HOURS} />
        <MonthlySummary summary={MY_SUMMARY} onRaiseCorrection={onRaiseCorrection} />
      </View>
    </RiseIn>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 14 },
});
