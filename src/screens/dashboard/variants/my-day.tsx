import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/auth/auth-context';
import { EmptyState } from '@/components/ui/empty-state';
import { ScreenGate } from '@/components/ui/screen-gate';
import { useMyDayDashboard } from '@/data/dashboard/hooks';
import { DUE_OPTIONS, STATUS_LABEL } from '@/data/tasks/mock';
import { useTheme } from '@/theme/theme-provider';
import { fontFamily, tabularNums } from '@/theme';

import { DashboardClockInCard } from '../clock-in-card';
import { DashboardCard, DashboardScroll } from '../dashboard-card';

function compactNpr(n: number): string {
  if (n >= 100_000) return `रु ${(n / 100_000).toFixed(1).replace(/\.0$/, '')}L`;
  return `रु ${Math.round(n).toLocaleString('en-US')}`;
}

/** `employee` / `nepal_staff` — just their own day. */
export function MyDayDashboard() {
  const theme = useTheme();
  const { canView } = useAuth();
  const { data, isLoading, isRefetching, refetch, isError, queries } = useMyDayDashboard();
  if (isError) return <ScreenGate queries={queries} />;

  const att = data.attendanceMonth;
  const attCells = [
    { key: 'present', label: 'Present', value: att.present, color: theme.textPrimary },
    { key: 'late', label: 'Late', value: att.late, color: theme.warningWashText },
    { key: 'leave', label: 'Leave', value: att.leave, color: theme.draftWashText },
    { key: 'absent', label: 'Absent', value: att.absent, color: theme.dangerWashText },
  ];

  const nothingYet =
    data.myOpenCount === 0 &&
    data.tasksDone === 0 &&
    att.present + att.late + att.leave + att.absent === 0;

  return (
    <DashboardScroll isRefetching={isRefetching} onRefresh={refetch} loading={isLoading && nothingYet}>
      <DashboardClockInCard />

      {canView('tasks') ? (
        <DashboardCard
          title="Your tasks"
          meta={`${data.myOpenCount} open`}
          onPress={() => router.push('/tasks')}
        >
          {data.myTasks.length === 0 ? (
            <EmptyState icon="check" title="All caught up" message="Nothing assigned to you right now." />
          ) : (
            <View>
              {data.myTasks.slice(0, 5).map((t, i) => (
                <View
                  key={t.id}
                  style={[
                    styles.taskRow,
                    i < Math.min(data.myTasks.length, 5) - 1 && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: theme.border,
                    },
                  ]}
                >
                  <View style={styles.taskText}>
                    <Text style={[styles.taskTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                      {t.title}
                    </Text>
                    <Text style={[styles.taskRef, tabularNums, { color: theme.textSecondary }]}>
                      {DUE_OPTIONS.find((d) => d.id === t.due)?.label ?? ''}
                    </Text>
                  </View>
                  <Text style={[styles.taskStatus, { color: theme.textSecondary }]}>{STATUS_LABEL[t.status]}</Text>
                </View>
              ))}
            </View>
          )}
        </DashboardCard>
      ) : null}

      {canView('attendance') ? (
        <DashboardCard title="Your attendance" meta="This month" onPress={() => router.push('/attendance')}>
          <View style={styles.statGrid}>
            {attCells.map((cell) => (
              <View key={cell.key} style={styles.statCell}>
                <Text style={[styles.statValue, tabularNums, { color: cell.color }]}>{cell.value}</Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{cell.label}</Text>
              </View>
            ))}
          </View>
        </DashboardCard>
      ) : null}

      {canView('finance') ? (
        <DashboardCard title="Spend · this month" onPress={() => router.push('/finance')}>
          <Text style={[styles.financeValue, tabularNums, { color: theme.textPrimary }]}>
            {compactNpr(data.financeMTD)}
          </Text>
        </DashboardCard>
      ) : null}
    </DashboardScroll>
  );
}

const styles = StyleSheet.create({
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  taskText: {
    flex: 1,
    gap: 2,
  },
  taskTitle: {
    fontSize: 14,
  },
  taskRef: {
    fontFamily: fontFamily.mono,
    fontSize: 11,
  },
  taskStatus: {
    fontFamily: fontFamily.mono,
    fontSize: 10,
    letterSpacing: 0.12 * 10,
    textTransform: 'uppercase',
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCell: {
    flexBasis: '22%',
    flexGrow: 1,
    gap: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: -0.02 * 22,
  },
  statLabel: {
    fontSize: 11.5,
  },
  financeValue: {
    fontFamily: fontFamily.semibold,
    fontSize: 30,
    letterSpacing: -0.02 * 30,
  },
});
