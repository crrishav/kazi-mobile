import { router } from 'expo-router';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { useAuth } from '@/auth/auth-context';
import { isAtLeast, ROLE_LABEL } from '@/auth/roles';
import { useUnreadCount } from '@/data/notifications/context';
import { useToast } from '@/components/toast/toast-provider';
import { useTheme } from '@/theme/theme-provider';
import { useDecideApproval, useApprovals, useUndoApproval } from '@/data/approvals/hooks';
import type { ApprovalItem } from '@/data/approvals/types';
import { useDashboardSummary, useRefreshDashboard } from '@/data/dashboard/hooks';

import { ApprovalsList } from './approvals-list';
import { AttendanceCard } from './attendance-card';
import { DashboardClockInCard } from './clock-in-card';
import { DashboardHeader } from './header';
import { KpiGrid } from './kpi-grid';
import { OrdersByStageCard } from './orders-by-stage-card';

export function Dashboard() {
  const theme = useTheme();
  const toast = useToast();
  const { profile, role } = useAuth();
  const unreadCount = useUnreadCount();

  // Everyone below Nepal admin (Nepal staff, employees) punches a clock; admins don't.
  const canClock = role != null && !isAtLeast(role, 'nepal_admin');

  const { data: summary, isRefetching, refetch } = useDashboardSummary();
  const invalidateSummary = useRefreshDashboard();
  const { data: approvals } = useApprovals();
  const decideApproval = useDecideApproval();
  const undoApproval = useUndoApproval();

  const handleRefresh = async () => {
    await invalidateSummary();
    await refetch();
  };

  const handleDecision = (item: ApprovalItem, index: number, decision: 'approve' | 'reject') => {
    decideApproval.mutate(item, {
      onSuccess: () => {
        toast.show({
          message: `${item.title} ${decision === 'approve' ? 'approved' : 'rejected'}`,
          tone: decision === 'approve' ? 'ok' : 'bad',
          action: {
            label: 'Undo',
            onPress: () => undoApproval.mutate({ item, index }),
          },
        });
      },
    });
  };

  if (!summary) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <DashboardHeader
        name={profile ? profile.name.split(' ')[0] : summary.userName}
        roleLine={profile ? profile.jobRole?.trim() || ROLE_LABEL[profile.role] : summary.roleLine}
        initials={profile?.initials ?? 'SR'}
        unreadCount={unreadCount}
        onPressNotifications={() => router.push('/notifications')}
        onPressAccount={() => router.push('/account')}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} tintColor={theme.accent} />}
      >
        {canClock ? <DashboardClockInCard /> : null}

        <KpiGrid kpis={summary.kpis} approvalsCount={approvals?.length ?? 0} />

        <OrdersByStageCard stages={summary.stages} total={summary.activeOrdersTotal} />

        <AttendanceCard breakdown={summary.attendance} onRoll={summary.attendanceOnRoll} />

        <ApprovalsList
          items={approvals ?? []}
          onApprove={(item, index) => handleDecision(item, index, 'approve')}
          onReject={(item, index) => handleDecision(item, index, 'reject')}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
    gap: 16,
  },
});
