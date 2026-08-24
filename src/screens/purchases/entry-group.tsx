import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { Icon } from '@/components/ui/icon';
import { StatusPill, type StatusKind } from '@/components/ui/status-pill';
import { useTheme } from '@/theme/theme-provider';
import { fontFamily, tabularNums } from '@/theme';
import { DAY_LABEL, STATUS } from '@/data/purchases/mock';
import { money } from '@/data/purchases/utils';
import type { PurchaseEntry, PurchaseGroup, PurchaseStatus } from '@/data/purchases/types';

const PILL_KIND: Record<PurchaseStatus, StatusKind> = {
  paid: 'on-track',
  partial: 'at-risk',
  unpaid: 'blocked',
};

export interface EntryGroupProps {
  title: string;
  total: string;
  hasUnpaid: boolean;
  entries: PurchaseEntry[];
  group: PurchaseGroup;
  onOpen: (id: string) => void;
}

export function EntryGroup({ title, total, hasUnpaid, entries, group, onOpen }: EntryGroupProps) {
  const theme = useTheme();

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: theme.textSecondary }]} numberOfLines={1}>
            {title}
          </Text>
          {hasUnpaid ? <View style={[styles.dot, { backgroundColor: theme.danger }]} /> : null}
        </View>
        <Text style={[styles.total, tabularNums, { color: theme.textPrimary }]}>{total}</Text>
      </View>

      {entries.map((e, i) => {
        const status = STATUS[e.status];
        const isCash = e.method === 'Cash';
        return (
          <Animated.View key={e.id} entering={FadeInUp.delay(Math.min(i, 6) * 30).duration(220)}>
            <Pressable
              onPress={() => onOpen(e.id)}
              style={[styles.row, { backgroundColor: theme.surface, boxShadow: theme.shadows.card, borderLeftColor: status.accent }]}
            >
              <View style={[styles.methodIcon, { backgroundColor: isCash ? theme.draftWash : theme.accentWash }]}>
                <Icon name={isCash ? 'credit-card' : 'home'} size={17} color={isCash ? theme.textSecondary : theme.accentDeep} />
              </View>
              <View style={styles.textWrap}>
                <View style={styles.topLine}>
                  <View style={styles.itemTextWrap}>
                    <Text style={[styles.itemName, { color: theme.textPrimary }]} numberOfLines={1}>
                      {e.item}
                    </Text>
                    <Text style={[styles.itemSub, tabularNums, { color: theme.textSecondary }]} numberOfLines={1}>
                      {group === 'date' ? `${e.supplier} · ${e.qty}` : `${e.ref} · ${e.qty}`}
                    </Text>
                  </View>
                  <Text style={[styles.amount, tabularNums, { color: theme.textPrimary }]}>{money(e.amount)}</Text>
                </View>
                <View style={styles.bottomLine}>
                  <StatusPill status={PILL_KIND[e.status]} label={status.label} />
                  <View style={[styles.methodChip, { backgroundColor: theme.draftWash, borderColor: theme.border }]}>
                    <Text style={[styles.methodText, { color: theme.textPrimary }]}>{e.method}</Text>
                  </View>
                  <View style={styles.flex1} />
                  <Text style={[styles.tail, tabularNums, { color: theme.textSecondary }]}>
                    {group === 'date' ? e.ref : (DAY_LABEL[e.date] ?? e.date).split(' · ').pop()}
                  </Text>
                </View>
              </View>
            </Pressable>
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 9 },
  header: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, paddingHorizontal: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, minWidth: 0 },
  title: { fontFamily: fontFamily.mono, fontSize: 10.5, letterSpacing: 0.12 * 10.5, textTransform: 'uppercase' },
  dot: { width: 6, height: 6, borderRadius: 99 },
  total: { fontFamily: fontFamily.mono, fontSize: 11 },
  row: { flexDirection: 'row', gap: 12, borderRadius: 18, padding: 14, borderLeftWidth: 4, marginTop: 9 },
  methodIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  textWrap: { flex: 1, gap: 6, minWidth: 0 },
  topLine: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  itemTextWrap: { flex: 1, gap: 3, minWidth: 0 },
  itemName: { fontFamily: fontFamily.semibold, fontSize: 15, letterSpacing: -0.01 * 15 },
  itemSub: { fontFamily: fontFamily.mono, fontSize: 10.5 },
  amount: { fontSize: 16, fontWeight: '600', flexShrink: 0 },
  bottomLine: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  methodChip: { height: 24, paddingHorizontal: 9, borderRadius: 999, borderWidth: 1, justifyContent: 'center' },
  methodText: { fontSize: 11.5 },
  flex1: { flex: 1 },
  tail: { fontFamily: fontFamily.mono, fontSize: 10.5 },
});
