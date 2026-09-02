import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/auth/auth-context';
import { ScreenGate } from '@/components/ui/screen-gate';
import { SegmentedProportionBar } from '@/components/ui/segmented-proportion-bar';
import { useDirectorDashboard } from '@/data/dashboard/hooks';
import { useTheme } from '@/theme/theme-provider';
import { tabularNums } from '@/theme';

import { ApprovalsSection } from '../approvals-section';
import { AttendanceCard } from '../attendance-card';
import { DashboardCard, DashboardScroll } from '../dashboard-card';
import { KpiRow } from '../kpi-tile';
import { OrdersByStageCard } from '../orders-by-stage-card';

/** `uk_admin` — the money-and-big-picture view. */
export function DirectorDashboard() {
  const theme = useTheme();
  const { canView } = useAuth();
  const { data, isLoading, isRefetching, refetch, isError, queries } = useDirectorDashboard();
  if (isError) return <ScreenGate queries={queries} />;

  const c = data.invoiceCounts;
  const invoiceRows = [
    { key: 'paid', label: 'Paid', value: c.paid, color: theme.accent },
    { key: 'partial', label: 'Partial', value: c.partial, color: theme.warningWashText },
    { key: 'overdue', label: 'Overdue', value: c.overdue, color: theme.danger },
    { key: 'draft', label: 'Draft', value: c.draft, color: theme.draftDot },
  ];
  const invoiceTotal = invoiceRows.reduce((n, r) => n + r.value, 0);
  const nothingYet = invoiceTotal === 0 && data.activeOrdersTotal === 0 && data.attendanceOnRoll === 0;

  return (
    <DashboardScroll isRefetching={isRefetching} onRefresh={refetch} loading={isLoading && nothingYet}>
      <KpiRow kpis={data.kpis} canView={canView} />

      {canView('billing') ? (
        <DashboardCard
          title="Invoices by status"
          meta={`${invoiceTotal} total`}
          onPress={() => router.push('/billing')}
        >
          <SegmentedProportionBar
            segments={invoiceRows.map((r) => ({ weight: r.value, color: r.color }))}
            height={8}
          />
          <View style={styles.legend}>
            {invoiceRows.map((r) => (
              <View key={r.key} style={styles.legendCell}>
                <Text style={[styles.legendValue, tabularNums, { color: theme.textPrimary }]}>{r.value}</Text>
                <View style={styles.legendLabelRow}>
                  <View style={[styles.dot, { backgroundColor: r.color }]} />
                  <Text style={[styles.legendLabel, { color: theme.textSecondary }]}>{r.label}</Text>
                </View>
              </View>
            ))}
          </View>
        </DashboardCard>
      ) : null}

      {canView('production') ? (
        <Pressable onPress={() => router.push('/production')} style={pressStyle}>
          <OrdersByStageCard stages={data.stages} total={data.activeOrdersTotal} />
        </Pressable>
      ) : null}

      {canView('attendance') ? (
        <Pressable onPress={() => router.push('/attendance')} style={pressStyle}>
          <AttendanceCard breakdown={data.attendance} onRoll={data.attendanceOnRoll} />
        </Pressable>
      ) : null}

      <ApprovalsSection />
    </DashboardScroll>
  );
}

const pressStyle = ({ pressed }: { pressed: boolean }) => (pressed ? styles.pressed : null);

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.92,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  legendCell: {
    flexBasis: '22%',
    flexGrow: 1,
    gap: 5,
  },
  legendValue: {
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: -0.02 * 22,
  },
  legendLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 99,
  },
  legendLabel: {
    fontSize: 11.5,
  },
});
