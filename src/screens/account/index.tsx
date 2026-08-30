import { ScrollView, StyleSheet, View } from 'react-native';

import { useAuth } from '@/auth/auth-context';
import { ScreenHeader } from '@/components/ui/screen-header';
import { isFirebaseConfigured } from '@/lib/firebase';
import { RoleSwitcher } from '@/screens/more/role-switcher';
import { useTheme } from '@/theme/theme-provider';

import { AccessSummary } from './access-summary';
import { IdentityCard } from './identity-card';
import { AccountActions } from './session-actions';

/**
 * Everything the signed-in person's account holds: identity (from the resolved
 * Firestore profile — `users/{uid}` + `employees` + `TEAM_MEMBERS`), the access
 * their role/overrides grant, and session actions (password reset, sign out).
 * Read-only — matches the reference web app, which has no in-app profile edit.
 */
export function Account() {
  const theme = useTheme();
  const { profile } = useAuth();

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <ScreenHeader title="Account" subtitle={profile?.email} />
      {profile ? (
        <ScrollView contentContainerStyle={styles.content}>
          <IdentityCard profile={profile} />
          <AccessSummary />
          {isFirebaseConfigured ? null : <RoleSwitcher />}
          <AccountActions email={profile.email} />
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 20, paddingBottom: 40, gap: 16 },
});
