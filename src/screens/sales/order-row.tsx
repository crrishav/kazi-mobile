import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { Avatar } from '@/components/ui/avatar';
import { SegmentedProportionBar } from '@/components/ui/segmented-proportion-bar';
import { useTheme } from '@/theme/theme-provider';
import { fontFamily, tabularNums } from '@/theme';
import { AVATAR_TINTS, STAGES } from '@/data/sales/mock';
import type { Order } from '@/data/sales/types';
import { initials, lakh } from '@/data/sales/utils';

export interface OrderRowProps {
  order: Order;
  index: number;
  isLate: boolean;
  onPress: () => void;
}

export function OrderRow({ order, index, isLate, onPress }: OrderRowProps) {
  const theme = useTheme();
  const stageIndex = STAGES.findIndex((s) => s.id === order.stage);
  const stage = STAGES[stageIndex];
  const tint = AVATAR_TINTS[index % AVATAR_TINTS.length];
  const segments = STAGES.map((_, i) => ({ weight: 1, color: i <= stageIndex ? stage.bar : theme.draftWash }));

  return (
    <Animated.View entering={FadeInUp.delay(Math.min(index, 6) * 30).duration(220)}>
      <Pressable
        onPress={onPress}
        style={[styles.card, { backgroundColor: theme.surface, boxShadow: theme.shadows.card, borderLeftColor: isLate ? theme.danger : theme.surface }]}
      >
        <View style={styles.topRow}>
          <Avatar initials={initials(order.customer)} tint={tint} size="md" />
          <View style={styles.textWrap}>
            <Text style={[styles.customer, { color: theme.textPrimary }]} numberOfLines={1}>
              {order.customer}
            </Text>
            <Text style={[styles.sub, tabularNums, { color: theme.textSecondary }]} numberOfLines={1}>
              {order.ref} · {order.product}
            </Text>
          </View>
          <View style={styles.qtyCol}>
            <Text style={[styles.qty, tabularNums, { color: theme.textPrimary }]}>{order.qty.toLocaleString()} pcs</Text>
            <Text style={[styles.ship, tabularNums, { color: isLate ? theme.dangerWashText : theme.textSecondary }]}>
              {order.stage === 'delivered' ? `shipped ${order.ship}` : `ships ${order.ship}`}
            </Text>
          </View>
        </View>

        <SegmentedProportionBar segments={segments} height={5} />

        <View style={styles.bottomRow}>
          <View style={[styles.pill, { backgroundColor: stage.bg }]}>
            <View style={[styles.pillDot, { backgroundColor: stage.dot }]} />
            <Text style={[styles.pillLabel, { color: stage.fg }]}>{stage.label}</Text>
          </View>
          <View style={styles.flex1} />
          <Text style={[styles.stageMeta, tabularNums, { color: theme.textSecondary }]}>
            {order.city} · {lakh(order.value)}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 20, padding: 15, gap: 12, borderLeftWidth: 4 },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 11 },
  textWrap: { flex: 1, gap: 3, minWidth: 0 },
  customer: { fontFamily: fontFamily.semibold, fontSize: 15.5, letterSpacing: -0.01 * 15.5 },
  sub: { fontFamily: fontFamily.mono, fontSize: 10.5 },
  qtyCol: { alignItems: 'flex-end', gap: 4, flexShrink: 0 },
  qty: { fontSize: 14.5, fontWeight: '600' },
  ship: { fontFamily: fontFamily.mono, fontSize: 10.5 },
  bottomRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 26, paddingHorizontal: 10, borderRadius: 999 },
  pillDot: { width: 6, height: 6, borderRadius: 99 },
  pillLabel: { fontSize: 12, fontWeight: '600' },
  flex1: { flex: 1 },
  stageMeta: { fontFamily: fontFamily.mono, fontSize: 10.5 },
});
