import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useToast } from '@/components/toast/toast-provider';
import { Avatar } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { ScreenHeader } from '@/components/ui/screen-header';
import { useTheme } from '@/theme/theme-provider';
import { fontFamily } from '@/theme';
import { useOrders, useRestoreOrders, useUpdateOrder } from '@/data/sales/hooks';
import { STAGES } from '@/data/sales/mock';
import type { Order, SalesFilter, SalesView } from '@/data/sales/types';

import { DetailView } from './detail-view';
import { FilterChips } from './filter-chips';
import { OrderRow } from './order-row';
import { Summary } from './summary';

function isLate(order: Order): boolean {
  return order.stage !== 'delivered' && order.shipDays <= 4;
}

export function Sales() {
  const theme = useTheme();
  const toast = useToast();

  const { data: orders } = useOrders();
  const updateOrder = useUpdateOrder();
  const restoreOrders = useRestoreOrders();

  const [filter, setFilter] = useState<SalesFilter>('all');
  const [view, setView] = useState<SalesView>('list');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (!orders) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }

  const selected = orders.find((o) => o.id === selectedId) ?? null;
  const lateOnes = orders.filter(isLate);

  let rows = orders;
  if (filter === 'late') rows = lateOnes;
  else if (filter !== 'all') rows = orders.filter((o) => o.stage === filter);
  rows = rows.slice().sort((a, b) => a.shipDays - b.shipDays);

  const filters: { id: SalesFilter; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: orders.length },
    { id: 'late', label: 'Late', count: lateOnes.length },
    ...STAGES.map((s) => ({ id: s.id as SalesFilter, label: s.short, count: orders.filter((o) => o.stage === s.id).length })),
  ];

  const hasLateBanner = lateOnes.length > 0 && filter !== 'late';

  const openDetail = (id: string) => {
    setSelectedId(id);
    setView('detail');
  };
  const backToList = () => {
    setView('list');
    setSelectedId(null);
  };

  const handleAdvance = () => {
    if (!selected) return;
    const stageIndex = STAGES.findIndex((s) => s.id === selected.stage);
    const next = STAGES[stageIndex + 1];
    if (!next) return;
    const before = orders;
    updateOrder.mutate({ id: selected.id, updates: { stage: next.id } });
    toast.show({
      message: `${selected.ref} moved to ${next.label}`,
      tone: 'ok',
      action: { label: 'Undo', onPress: () => restoreOrders.mutate(before) },
    });
  };

  if (view === 'detail' && selected) {
    return (
      <View style={[styles.flex, { backgroundColor: theme.background }]}>
        <ScreenHeader title={selected.customer} subtitle={`${selected.ref} · ${selected.qty.toLocaleString()} pcs`} onBack={backToList} />
        <ScrollView contentContainerStyle={styles.content}>
          <DetailView order={selected} onAdvance={handleAdvance} />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <ScreenHeader title="Sales" subtitle={`${orders.length} orders · week 34 · 2026`} rightSlot={<Avatar initials="PT" tint="dark" size="lg" />} />

      <ScrollView contentContainerStyle={styles.content}>
        <Summary orders={orders} />

        <FilterChips filters={filters} active={filter} onChange={setFilter} />

        {hasLateBanner ? (
          <Pressable onPress={() => setFilter('late')} style={[styles.lateBanner, { backgroundColor: theme.dangerWash, borderColor: theme.scheme === 'light' ? '#E3C9BE' : theme.border }]}>
            <Icon name="alert-circle" size={18} color={theme.dangerWashText} />
            <Text style={[styles.lateBannerText, { color: theme.dangerWashText }]}>
              {lateOnes.length} {lateOnes.length === 1 ? 'order ships' : 'orders ship'} within four days
            </Text>
            <Icon name="chevron-right" size={15} color={theme.dangerWashText} />
          </Pressable>
        ) : null}

        {rows.length === 0 ? (
          <EmptyState icon="shopping-bag" title="No orders in this stage" message={`Tap "All" to see every one of the ${orders.length} open orders.`} />
        ) : (
          rows.map((o, i) => <OrderRow key={o.id} order={o} index={i} isLate={isLate(o)} onPress={() => openDetail(o.id)} />)
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, paddingTop: 4, paddingBottom: 32, gap: 12 },
  lateBanner: { flexDirection: 'row', alignItems: 'center', gap: 11, borderRadius: 16, borderWidth: 1, padding: 14 },
  lateBannerText: { flex: 1, fontSize: 13.5, lineHeight: 13.5 * 1.4, fontFamily: fontFamily.regular },
});
