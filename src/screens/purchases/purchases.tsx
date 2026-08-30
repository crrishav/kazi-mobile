import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { HeaderAccount } from '@/components/ui/header-account';
import { PermissionNotice } from '@/components/ui/permission-notice';
import { ScreenHeader } from '@/components/ui/screen-header';
import { useTheme } from '@/theme/theme-provider';
import { useEntries } from '@/data/purchases/hooks';

import { PurchasesPane } from './purchases-pane';

export function Purchases() {
  const theme = useTheme();
  const { data: entries } = useEntries();

  if (!entries) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <ScreenHeader
        title="Purchases"
        subtitle={`${entries.length} entries · finance_purchases`}
        rightSlot={<HeaderAccount />}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.notice}>
          <PermissionNotice section="purchases" />
        </View>
        <PurchasesPane />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingTop: 4, paddingBottom: 120 },
  notice: { paddingHorizontal: 20 },
});
