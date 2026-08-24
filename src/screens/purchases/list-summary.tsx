import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { useTheme } from '@/theme/theme-provider';
import { fontFamily, tabularNums } from '@/theme';
import type { PurchaseFilter, PurchaseGroup } from '@/data/purchases/types';

export interface ListSummaryProps {
  monthTotal: string;
  unpaidTotal: string;
  cashShare: string;
  group: PurchaseGroup;
  onGroupChange: (g: PurchaseGroup) => void;
  filters: { id: PurchaseFilter; label: string; count: number }[];
  activeFilter: PurchaseFilter;
  onFilterChange: (f: PurchaseFilter) => void;
}

export function ListSummary({ monthTotal, unpaidTotal, cashShare, group, onGroupChange, filters, activeFilter, onFilterChange }: ListSummaryProps) {
  const theme = useTheme();

  return (
    <View style={styles.wrap}>
      <Card elevation="inverted" style={styles.summaryCard}>
        <View style={styles.gap5}>
          <Text style={[styles.eyebrow, { color: theme.onDark.textMuted }]}>Spend this month</Text>
          <Text style={[styles.monthValue, tabularNums, { color: theme.onDark.text }]}>{monthTotal}</Text>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statCell}>
            <Text style={[styles.statValue, tabularNums, { color: theme.onDark.dangerWashText }]}>{unpaidTotal}</Text>
            <Text style={[styles.statLabel, { color: theme.onDark.textMuted }]}>Unpaid</Text>
          </View>
          <View style={styles.statCell}>
            <Text style={[styles.statValue, tabularNums, { color: theme.onDark.accent }]}>{cashShare}</Text>
            <Text style={[styles.statLabel, { color: theme.onDark.textMuted }]}>Cash</Text>
          </View>
        </View>
      </Card>

      <View style={[styles.segmented, { backgroundColor: theme.draftWash, borderColor: theme.border }]}>
        <Pressable
          onPress={() => onGroupChange('date')}
          style={[styles.segmentButton, { backgroundColor: group === 'date' ? theme.surface : 'transparent', boxShadow: group === 'date' ? theme.shadows.card : undefined }]}
        >
          <Text style={[styles.segmentLabel, { color: group === 'date' ? theme.textPrimary : theme.textSecondary }]}>By date</Text>
        </Pressable>
        <Pressable
          onPress={() => onGroupChange('supplier')}
          style={[styles.segmentButton, { backgroundColor: group === 'supplier' ? theme.surface : 'transparent', boxShadow: group === 'supplier' ? theme.shadows.card : undefined }]}
        >
          <Text style={[styles.segmentLabel, { color: group === 'supplier' ? theme.textPrimary : theme.textSecondary }]}>By supplier</Text>
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
        {filters.map((f) => {
          const on = activeFilter === f.id;
          return (
            <Pressable
              key={f.id}
              onPress={() => onFilterChange(f.id)}
              style={[styles.chip, { backgroundColor: on ? theme.surfaceInverted : theme.surface, borderColor: on ? theme.surfaceInverted : theme.border }]}
            >
              <Text style={[styles.chipLabel, { color: on ? theme.onDark.text : theme.textPrimary }]}>{f.label}</Text>
              <Text style={[styles.chipCount, tabularNums, { color: on ? theme.onDark.textMuted : theme.textSecondary }]}>{f.count}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 10,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  summaryCard: { padding: 17, gap: 14, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  gap5: { gap: 5 },
  eyebrow: { fontFamily: fontFamily.mono, fontSize: 10, letterSpacing: 0.12 * 10, textTransform: 'uppercase' },
  monthValue: { fontFamily: fontFamily.semibold, fontSize: 28, letterSpacing: -0.025 * 28, lineHeight: 28 },
  statsRow: { flexDirection: 'row', gap: 16 },
  statCell: { alignItems: 'flex-end', gap: 3 },
  statValue: { fontSize: 16, fontWeight: '600', lineHeight: 16 },
  statLabel: { fontFamily: fontFamily.mono, fontSize: 9.5, letterSpacing: 0.1 * 9.5, textTransform: 'uppercase' },
  segmented: { flexDirection: 'row', padding: 4, borderRadius: 14, borderWidth: 1, gap: 4 },
  segmentButton: { flex: 1, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  segmentLabel: { fontFamily: fontFamily.semibold, fontSize: 13 },
  chipsRow: { gap: 7 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 32, paddingHorizontal: 13, borderRadius: 999, borderWidth: 1 },
  chipLabel: { fontFamily: fontFamily.semibold, fontSize: 12.5 },
  chipCount: { fontFamily: fontFamily.mono, fontSize: 10.5, opacity: 0.85 },
});
