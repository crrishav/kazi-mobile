import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { useAuth } from '@/auth/auth-context';
import { ROLE_LABEL } from '@/auth/roles';
import { useUnreadCount } from '@/data/notifications/context';
import { useTheme } from '@/theme/theme-provider';

import { DashboardHeader } from './header';
import { DirectorDashboard } from './variants/director';
import { MyDayDashboard } from './variants/my-day';
import { OpsDashboard } from './variants/ops';

/**
 * One dashboard per role (mirrors the reference `Dashboard.jsx` split):
 *   uk_admin              → Director  (money + big picture)
 *   employee / nepal_staff → My day   (own tasks, attendance, clock-in)
 *   nepal_admin / super_admin → Ops   (factory floor)
 * Every card inside a variant deep-links to its module and is hidden when the
 * signed-in profile can't view that section.
 */
export function Dashboard() {
  const theme = useTheme();
  const { profile, role } = useAuth();
  const unreadCount = useUnreadCount();

  const Variant =
    role === 'uk_admin'
      ? DirectorDashboard
      : role === 'employee' || role === 'nepal_staff'
        ? MyDayDashboard
        : OpsDashboard;

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <DashboardHeader
        name={profile ? profile.name.split(' ')[0] : 'there'}
        roleLine={profile ? profile.jobRole?.trim() || ROLE_LABEL[profile.role] : ''}
        initials={profile?.initials ?? 'SR'}
        unreadCount={unreadCount}
        onPressNotifications={() => router.push('/notifications')}
        onPressAccount={() => router.push('/account')}
      />
      <Variant />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});
