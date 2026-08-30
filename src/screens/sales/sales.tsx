import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { HeaderAccount } from '@/components/ui/header-account';
import { EmptyState } from '@/components/ui/empty-state';
import { ScreenHeader } from '@/components/ui/screen-header';
import { useTheme } from '@/theme/theme-provider';
import { useOrders } from '@/data/sales/hooks';

import { StageBreakdown } from './stage-breakdown';
import { Summary } from './summary';
import { TopCustomers } from './top-customers';

/**
 * Sales is a read-only pipeline overview off the shared `orders` collection —
 * KPI row, stage breakdown, top customers. Order CRUD lives in Order Management.
 */
export function Sales() {
  const theme = useTheme();
  const { data: orders } = useOrders();

  if (!orders) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }

  const active = orders.filter((o) => o.stage !== 'delivered').length;

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <ScreenHeader
        title="Sales"
        subtitle={`Pipeline overview · ${active} active`}
        rightSlot={<HeaderAccount />}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {orders.length === 0 ? (
          <EmptyState icon="shopping-bag" title="No orders yet" message="Orders created in Order Management will appear here." />
        ) : (
          <>
            <Summary orders={orders} />
            <StageBreakdown orders={orders} />
            <TopCustomers orders={orders} />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, paddingTop: 4, paddingBottom: 32, gap: 12 },
});
