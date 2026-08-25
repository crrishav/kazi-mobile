import { StyleSheet, View } from 'react-native';

import { RiseIn } from '@/components/ui/rise-in';
import { MY_SUMMARY } from '@/data/attendance/mock';

import { ClockCard } from './clock-card';
import { MonthCalendar } from './month-calendar';
import { MonthlySummary } from './monthly-summary';

export interface MineViewProps {
  clockedIn: boolean;
  inTime: string;
  outTime: string | null;
  elapsedSeconds: number;
  onToggleClock: () => void;
  onRaiseCorrection: () => void;
}

export function MineView({ clockedIn, inTime, outTime, elapsedSeconds, onToggleClock, onRaiseCorrection }: MineViewProps) {
  return (
    <RiseIn viewKey="mine">
      <View style={styles.wrap}>
        <ClockCard clockedIn={clockedIn} inTime={inTime} outTime={outTime} elapsedSeconds={elapsedSeconds} onToggle={onToggleClock} />
        <MonthCalendar />
        <MonthlySummary summary={MY_SUMMARY} onRaiseCorrection={onRaiseCorrection} />
      </View>
    </RiseIn>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 14 },
});
