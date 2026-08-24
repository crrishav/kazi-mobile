import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '@/components/ui/empty-state';
import { Icon, type IconName } from '@/components/ui/icon';
import { useTheme } from '@/theme/theme-provider';
import { fontFamily, type Theme } from '@/theme';
import type { LedgerRowType } from '@/data/finance/types';

export type LedgerFilter = 'all' | LedgerRowType;

export interface LedgerViewMonth {
  title: string;
  gregorian: string;
  net: string;
  netPositive: boolean;
  rows: {
    type: LedgerRowType;
    title: string;
    meta: string;
    amount: string;
    positive: boolean;
  }[];
}

export interface LedgerViewProps {
  filters: { id: LedgerFilter; label: string; count: number }[];
  activeFilter: LedgerFilter;
  onFilterChange: (f: LedgerFilter) => void;
  months: LedgerViewMonth[];
  totalEntries: number;
}

const TYPE_ICON: Record<LedgerRowType, IconName> = { bank: 'credit-card', journal: 'book', expense: 'shopping-bag' };

export function LedgerView({ filters, activeFilter, onFilterChange, months, totalEntries }: LedgerViewProps) {
  const theme = useTheme();

  return (
    <View style={styles.flex}>
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
              <Text style={[styles.chipCount, { color: on ? theme.onDark.textMuted : theme.textSecondary }]}>{f.count}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.monthsGroup}>
        {months.length === 0 ? (
          <EmptyState icon="book" title="Nothing of that type" message={`This year holds ${totalEntries} entries in total — tap "All" to see them.`} />
        ) : (
          months.map((m) => (
            <View key={m.title} style={styles.month}>
              <View style={styles.monthHeader}>
                <View style={styles.monthTitleRow}>
                  <Text style={[styles.monthTitle, { color: theme.textSecondary }]}>{m.title}</Text>
                  <Text style={[styles.monthGregorian, { color: theme.textSecondary, opacity: 0.7 }]}>{m.gregorian}</Text>
                </View>
                <Text style={[styles.monthNet, { color: m.netPositive ? theme.accentWashText : theme.dangerWashText }]}>{m.net}</Text>
              </View>
              {m.rows.map((r, i) => (
                <View key={i} style={[styles.row, { backgroundColor: theme.surface, boxShadow: theme.shadows.card }]}>
                  <View style={[styles.rowIcon, { backgroundColor: rowIconBg(theme, r.type) }]}>
                    <Icon name={TYPE_ICON[r.type]} size={15} color={rowIconFg(theme, r.type)} />
                  </View>
                  <View style={styles.rowTextWrap}>
                    <Text style={[styles.rowTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                      {r.title}
                    </Text>
                    <Text style={[styles.rowMeta, { color: theme.textSecondary }]} numberOfLines={1}>
                      {r.meta}
                    </Text>
                  </View>
                  <Text style={[styles.rowAmount, { color: r.positive ? theme.accentWashText : theme.textPrimary }]}>{r.amount}</Text>
                </View>
              ))}
            </View>
          ))
        )}
      </View>
    </View>
  );
}

function rowIconBg(theme: Theme, type: LedgerRowType) {
  if (type === 'bank') return theme.accentWash;
  if (type === 'expense') return theme.warningWash;
  return theme.draftWash;
}
function rowIconFg(theme: Theme, type: LedgerRowType) {
  if (type === 'bank') return theme.accentWashText;
  if (type === 'expense') return theme.warningWashText;
  return theme.textSecondary;
}

const styles = StyleSheet.create({
  flex: { gap: 16 },
  chipsRow: { gap: 7 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 32, paddingHorizontal: 13, borderRadius: 999, borderWidth: 1 },
  chipLabel: { fontFamily: fontFamily.semibold, fontSize: 12.5 },
  chipCount: { fontFamily: fontFamily.mono, fontSize: 10.5 },
  monthsGroup: { gap: 16 },
  month: { gap: 9 },
  monthHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, paddingHorizontal: 2 },
  monthTitleRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, minWidth: 0 },
  monthTitle: { fontFamily: fontFamily.mono, fontSize: 10.5, letterSpacing: 0.12 * 10.5, textTransform: 'uppercase' },
  monthGregorian: { fontFamily: fontFamily.mono, fontSize: 9.5 },
  monthNet: { fontFamily: fontFamily.mono, fontSize: 11, flexShrink: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, padding: 13 },
  rowIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rowTextWrap: { flex: 1, gap: 3, minWidth: 0 },
  rowTitle: { fontSize: 14, fontWeight: '600' },
  rowMeta: { fontFamily: fontFamily.mono, fontSize: 10 },
  rowAmount: { fontSize: 14, fontWeight: '600', flexShrink: 0 },
});
