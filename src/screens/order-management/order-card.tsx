import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/theme-provider';
import { fontFamily, tabularNums } from '@/theme';
import type { Order } from '@/data/sales/types';
import { lakh } from '@/data/sales/utils';

export interface OrderCardProps {
  order: Order;
  onPress: () => void;
  onMovePrev?: () => void;
  onMoveNext?: () => void;
  canPrev: boolean;
  canNext: boolean;
}

export function OrderCard({ order, onPress, onMovePrev, onMoveNext, canPrev, canNext }: OrderCardProps) {
  const theme = useTheme();
  const cancelled = order.status === 'cancelled';

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: order.priority === 'high' ? theme.warning : theme.border,
          opacity: cancelled ? 0.5 : 1,
        },
      ]}
    >
      <View style={styles.topRow}>
        <Text style={[styles.customer, { color: theme.textPrimary }]} numberOfLines={1}>
          {order.customer}
        </Text>
        {order.priority === 'high' ? (
          <View style={[styles.prioTag, { backgroundColor: theme.warningWash }]}>
            <Text style={[styles.prioText, { color: theme.warningWashText }]}>High</Text>
          </View>
        ) : null}
      </View>

      <Text style={[styles.sub, tabularNums, { color: theme.textSecondary }]} numberOfLines={1}>
        {order.ref} · {order.product}
      </Text>

      <View style={styles.metaRow}>
        <Text style={[styles.meta, tabularNums, { color: theme.textSecondary }]}>
          {order.qty.toLocaleString()} pcs · {lakh(order.value)}
        </Text>
      </View>

      {cancelled ? (
        <Text style={[styles.cancelled, { color: theme.dangerWashText }]}>Cancelled</Text>
      ) : (
        <View style={styles.moveRow}>
          <Pressable
            onPress={onMovePrev}
            disabled={!canPrev || !onMovePrev}
            hitSlop={6}
            style={[styles.moveBtn, { borderColor: theme.border, opacity: canPrev && onMovePrev ? 1 : 0.35 }]}
          >
            <Text style={[styles.moveGlyph, { color: theme.textPrimary }]}>‹</Text>
          </Pressable>
          <Pressable
            onPress={onMoveNext}
            disabled={!canNext || !onMoveNext}
            hitSlop={6}
            style={[styles.moveBtn, { borderColor: theme.border, opacity: canNext && onMoveNext ? 1 : 0.35 }]}
          >
            <Text style={[styles.moveGlyph, { color: theme.textPrimary }]}>›</Text>
          </Pressable>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 14, borderWidth: 1, padding: 12, gap: 6 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  customer: { flex: 1, fontFamily: fontFamily.semibold, fontSize: 13.5, letterSpacing: -0.01 * 13.5 },
  prioTag: { height: 18, paddingHorizontal: 6, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  prioText: { fontFamily: fontFamily.mono, fontSize: 8.5, letterSpacing: 0.1 * 8.5, textTransform: 'uppercase' },
  sub: { fontFamily: fontFamily.mono, fontSize: 9.5 },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  meta: { fontFamily: fontFamily.mono, fontSize: 9.5 },
  cancelled: { fontFamily: fontFamily.mono, fontSize: 9.5, textTransform: 'uppercase', letterSpacing: 0.08 * 9.5 },
  moveRow: { flexDirection: 'row', gap: 6, paddingTop: 2 },
  moveBtn: { flex: 1, height: 26, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  moveGlyph: { fontSize: 16, fontWeight: '600', marginTop: -2 },
});
