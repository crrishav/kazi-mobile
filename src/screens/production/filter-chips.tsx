import { ScrollView, Pressable, StyleSheet, Text } from 'react-native';

import { useTheme } from '@/theme/theme-provider';
import { fontFamily } from '@/theme';
import type { ProductionFilter } from '@/data/production/types';

export interface FilterChipsProps {
  filters: { id: ProductionFilter; label: string; count: number }[];
  active: ProductionFilter;
  onChange: (f: ProductionFilter) => void;
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
  row: {
    gap: 8,
    paddingBottom: 2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
  },
  label: {
    fontFamily: fontFamily.semibold,
    fontSize: 13,
  },
  count: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    opacity: 0.65,
  },
});
