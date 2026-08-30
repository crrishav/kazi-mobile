import { router } from 'expo-router';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/auth/auth-context';
import { ROLE_LABEL } from '@/auth/roles';
import { useUnreadCount } from '@/data/notifications/context';
import { useToast } from '@/components/toast/toast-provider';
import { useTheme } from '@/theme/theme-provider';
import { fontFamily } from '@/theme';
import { useDecideApproval, useApprovals, useUndoApproval } from '@/data/approvals/hooks';
import type { ApprovalItem } from '@/data/approvals/types';
import { useDashboardSummary, useRefreshDashboard } from '@/data/dashboard/hooks';

import { ApprovalsList } from './approvals-list';
import { AttendanceCard } from './attendance-card';
import { DashboardHeader } from './header';
import { KpiGrid } from './kpi-grid';
import { OrdersByStageCard } from './orders-by-stage-card';

export function Dashboard() {
  const theme = useTheme();
  const toast = useToast();
  const { profile } = useAuth();
  const unreadCount = useUnreadCount();

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
        <View style={styles.updatedRow}>
          <Text style={[styles.updatedText, { color: theme.textSecondary }]}>Updated {summary.updatedAgo}</Text>
          <View style={styles.liveRow}>
            <View style={[styles.liveDot, { backgroundColor: theme.accent }]} />
            <Text style={[styles.updatedText, { color: theme.textSecondary }]}>Live</Text>
          </View>
        </View>

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
  updatedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  updatedText: {
    fontFamily: fontFamily.mono,
    fontSize: 10,
    letterSpacing: 0.12 * 10,
    textTransform: 'uppercase',
  },
  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 99,
  },
});
