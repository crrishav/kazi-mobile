import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { useToast } from '@/components/toast/toast-provider';
import { Avatar } from '@/components/ui/avatar';
import { ScreenHeader } from '@/components/ui/screen-header';
import { useTheme } from '@/theme/theme-provider';
import { useClockStatus, useTeamRoster, useToggleClock } from '@/data/attendance/hooks';
import { DEFAULT_CLOCK_STATUS, MONTH_LABEL } from '@/data/attendance/mock';
import type { AttendanceView, TeamFilter } from '@/data/attendance/types';

import { MineView } from './mine-view';
import { TabsHeader } from './tabs-header';
import { TeamView } from './team-view';

export function Attendance() {
  const theme = useTheme();
  const toast = useToast();

  const { data: clockStatus } = useClockStatus();
  const toggleClock = useToggleClock();
  const { data: team } = useTeamRoster();

  const [view, setView] = useState<AttendanceView>('mine');
  const [filter, setFilter] = useState<TeamFilter>('all');
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

  if (!clockStatus || !team) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }

  const counts: Record<TeamFilter, number> = { all: team.length, present: 0, late: 0, absent: 0, half: 0, leave: 0 };
  team.forEach((m) => {
    counts[m.status] += 1;
  });
  const filteredMembers = team.filter((m) => filter === 'all' || m.status === filter);

  const handleToggleClock = () => toggleClock.mutate(elapsed);
  const handleRaiseCorrection = () => toast.show({ message: 'Correction request sent · HR reviews within 2 working days', tone: 'ok' });
  const handleExportPayroll = () => toast.show({ message: `Payroll sheet exported · Line 3, ${MONTH_LABEL}`, tone: 'ok' });

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <ScreenHeader title="Attendance" subtitle="Tue 26 Aug · Shift A" rightSlot={<Avatar initials="SR" tint="dark" size="lg" />} />
      <TabsHeader view={view} onChange={setView} />

      <ScrollView contentContainerStyle={styles.content}>
        {view === 'mine' ? (
          <MineView
            clockedIn={clockStatus.clockedIn}
            inTime={clockStatus.inTime}
            outTime={clockStatus.outTime}
            elapsedSeconds={elapsed}
            onToggleClock={handleToggleClock}
            onRaiseCorrection={handleRaiseCorrection}
          />
        ) : (
          <TeamView filter={filter} onFilterChange={setFilter} counts={counts} members={filteredMembers} onExportPayroll={handleExportPayroll} />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, paddingTop: 4, paddingBottom: 110, gap: 16 },
});
