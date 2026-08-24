import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { useTheme } from '@/theme/theme-provider';
import { fontFamily, tabularNums } from '@/theme';
import type { CustomersFilter } from '@/data/customers/types';

export interface ListSummaryProps {
  query: string;
  onQueryChange: (v: string) => void;
  filters: { id: CustomersFilter; label: string; count: number }[];
  activeFilter: CustomersFilter;
  onFilterChange: (f: CustomersFilter) => void;
  totalCount: number;
  splitLabel: string;
  owedTotal: string;
  hasOwed: boolean;
}

export function ListSummary({ query, onQueryChange, filters, activeFilter, onFilterChange, totalCount, splitLabel, owedTotal, hasOwed }: ListSummaryProps) {
  const theme = useTheme();

  return (
    <View style={styles.wrap}>
      <View style={[styles.searchRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Icon name="search" size={16} color={theme.textSecondary} />
        <TextInput
          value={query}
          onChangeText={onQueryChange}
          placeholder="Name, company or city"
          placeholderTextColor={theme.textSecondary}
          style={[styles.searchInput, { color: theme.textPrimary, fontFamily: fontFamily.regular }]}
        />
        {query.length > 0 ? (
          <Pressable onPress={() => onQueryChange('')} hitSlop={8}>
            <Text style={[styles.clearLabel, { color: theme.accentDeep }]}>clear</Text>
          </Pressable>
        ) : null}
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

      <Card elevation="inverted" style={styles.statsCard}>
        <View style={styles.gap6}>
          <Text style={[styles.eyebrow, { color: theme.onDark.textMuted }]}>Accounts</Text>
          <View style={styles.baselineRow}>
            <Text style={[styles.statValue, tabularNums, { color: theme.onDark.text }]}>{totalCount}</Text>
            <Text style={[styles.splitLabel, { color: theme.onDark.textMuted }]}>{splitLabel}</Text>
          </View>
        </View>
        <View style={[styles.gap5, styles.alignEnd]}>
          <Text style={[styles.eyebrow, { color: theme.onDark.textMuted }]}>Owed to us</Text>
          <Text style={[styles.owedValue, tabularNums, { color: hasOwed ? theme.onDark.dangerWashText : theme.onDark.text }]}>{owedTotal}</Text>
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 46, paddingHorizontal: 14, borderRadius: 15, borderWidth: 1 },
  searchInput: { flex: 1, fontSize: 15, padding: 0 },
  clearLabel: { fontFamily: fontFamily.mono, fontSize: 11 },
  chipsRow: { gap: 7 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 32, paddingHorizontal: 13, borderRadius: 999, borderWidth: 1 },
  chipLabel: { fontFamily: fontFamily.semibold, fontSize: 12.5 },
  chipCount: { fontFamily: fontFamily.mono, fontSize: 10.5, opacity: 0.85 },
  statsCard: { padding: 17, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 14 },
  gap5: { gap: 5 },
  gap6: { gap: 6 },
  alignEnd: { alignItems: 'flex-end' },
  eyebrow: { fontFamily: fontFamily.mono, fontSize: 10, letterSpacing: 0.12 * 10, textTransform: 'uppercase' },
  baselineRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  statValue: { fontFamily: fontFamily.semibold, fontSize: 32, letterSpacing: -0.03 * 32, lineHeight: 32 },
  splitLabel: { fontFamily: fontFamily.mono, fontSize: 11.5 },
  owedValue: { fontSize: 17, fontWeight: '600', lineHeight: 17 },
});
