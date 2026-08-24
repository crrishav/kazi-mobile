import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { useTheme } from '@/theme/theme-provider';
import { fontFamily } from '@/theme';
import type { SalesFilter } from '@/data/sales/types';

export interface FilterChipsProps {
  filters: { id: SalesFilter; label: string; count: number }[];
  active: SalesFilter;
  onChange: (f: SalesFilter) => void;
}

export function FilterChips({ filters, active, onChange }: FilterChipsProps) {
  const theme = useTheme();

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {filters.map((f) => {
        const on = active === f.id;
        return (
          <Pressable
            key={f.id}
            onPress={() => onChange(f.id)}
            style={[styles.chip, { backgroundColor: on ? theme.surfaceInverted : theme.surface, borderColor: on ? theme.surfaceInverted : theme.border }]}
          >
            <Text style={[styles.label, { color: on ? theme.onDark.text : theme.textPrimary }]}>{f.label}</Text>
            <Text style={[styles.count, { color: on ? theme.onDark.textMuted : theme.textSecondary }]}>{f.count}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 7, paddingTop: 2 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 32, paddingHorizontal: 13, borderRadius: 999, borderWidth: 1 },
  label: { fontFamily: fontFamily.semibold, fontSize: 12.5 },
  count: { fontFamily: fontFamily.mono, fontSize: 10.5, opacity: 0.85 },
});
