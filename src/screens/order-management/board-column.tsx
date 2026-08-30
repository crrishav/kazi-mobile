import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/theme-provider';
import { fontFamily, tabularNums } from '@/theme';
import { STAGE_IDS } from '@/data/sales/mock';
import type { Order, Stage } from '@/data/sales/types';

import { OrderCard } from './order-card';

export interface BoardColumnProps {
  stage: Stage;
  orders: Order[];
  canEdit: boolean;
  onOpen: (order: Order) => void;
  onMove: (order: Order, dir: -1 | 1) => void;
}

export function BoardColumn({ stage, orders, canEdit, onOpen, onMove }: BoardColumnProps) {
  const theme = useTheme();
  const idx = STAGE_IDS.indexOf(stage.id);

  return (
    <View style={[styles.column, { backgroundColor: theme.surfaceRaised, borderColor: theme.border }]}>
      <View style={styles.header}>
        <View style={[styles.dot, { backgroundColor: stage.dot }]} />
        <Text style={[styles.label, { color: theme.textPrimary }]} numberOfLines={1}>
          {stage.short}
        </Text>
        <Text style={[styles.count, tabularNums, { color: theme.textSecondary }]}>{orders.length}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.cards} showsVerticalScrollIndicator={false}>
        {orders.length === 0 ? (
          <Text style={[styles.empty, { color: theme.textSecondary }]}>—</Text>
        ) : (
          orders.map((o) => (
            <OrderCard
              key={o.id}
              order={o}
              onPress={() => onOpen(o)}
              onMovePrev={canEdit ? () => onMove(o, -1) : undefined}
              onMoveNext={canEdit ? () => onMove(o, 1) : undefined}
              canPrev={idx > 0}
              canNext={idx < STAGE_IDS.length - 1}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  column: { width: 210, borderRadius: 16, borderWidth: 1, padding: 10, gap: 10, maxHeight: '100%' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  dot: { width: 8, height: 8, borderRadius: 99 },
  label: { flex: 1, fontFamily: fontFamily.semibold, fontSize: 12.5 },
  count: { fontFamily: fontFamily.mono, fontSize: 10.5 },
  cards: { gap: 8, paddingBottom: 4 },
  empty: { fontFamily: fontFamily.mono, fontSize: 11, textAlign: 'center', paddingVertical: 10 },
});
