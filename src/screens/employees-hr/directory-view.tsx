import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { useTheme } from '@/theme/theme-provider';
import { fontFamily, tabularNums } from '@/theme';

import { PersonRow, type PersonRowModel } from './person-row';

export interface DirectoryViewProps {
  activeCount: number;
  netPayrollTotal: string;
  rollNote: string;
  runStatusNote: string;
  query: string;
  onQueryChange: (v: string) => void;
  filters: { id: string; label: string; count: number }[];
  activeFilter: string;
  onFilterChange: (id: string) => void;
  people: PersonRowModel[];
  onOpenPerson: (id: number) => void;
  onAdd: () => void;
}

export function DirectoryView({
  activeCount,
  netPayrollTotal,
  rollNote,
  runStatusNote,
  query,
  onQueryChange,
  filters,
  activeFilter,
  onFilterChange,
  people,
  onOpenPerson,
  onAdd,
}: DirectoryViewProps) {
  const theme = useTheme();

  return (
    <View style={styles.wrap}>
      <Card elevation="inverted" style={styles.summaryCard}>
        <View style={styles.summaryTopRow}>
          <View style={styles.gap6}>
            <Text style={[styles.eyebrow, { color: theme.onDark.textMuted }]}>Active staff</Text>
            <Text style={[styles.activeValue, tabularNums, { color: theme.onDark.text }]}>{activeCount}</Text>
          </View>
          <View style={[styles.gap6, styles.alignEnd]}>
            <Text style={[styles.eyebrow, { color: theme.onDark.textMuted }]}>Aug net payroll</Text>
            <Text style={[styles.netValue, tabularNums, { color: theme.onDark.text }]}>{netPayrollTotal}</Text>
          </View>
        </View>
        <View style={[styles.divider, { backgroundColor: 'rgba(233,241,236,0.14)' }]} />
        <View style={styles.rollRow}>
          <Text style={[styles.rollNote, { color: theme.onDark.textMuted }]}>{rollNote}</Text>
          <Text style={[styles.runStatus, { color: theme.onDark.accent }]}>{runStatusNote}</Text>
        </View>
      </Card>

      <View style={[styles.searchRow, { backgroundColor: theme.surface, borderColor: theme.border, boxShadow: theme.shadows.card }]}>
        <Icon name="search" size={17} color={theme.textSecondary} />
        <TextInput
          value={query}
          onChangeText={onQueryChange}
          placeholder="Search name, role or ID"
          placeholderTextColor={theme.textSecondary}
          style={[styles.searchInput, { color: theme.textPrimary }]}
        />
        {query.length > 0 ? (
          <Pressable onPress={() => onQueryChange('')} hitSlop={8} style={[styles.clearButton, { backgroundColor: theme.draftWash }]}>
            <Icon name="x" size={12} color={theme.textSecondary} />
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

      <View style={styles.peopleGroup}>
        {people.map((p, i) => (
          <PersonRow key={p.id} person={p} index={i} onPress={() => onOpenPerson(p.id)} />
        ))}
      </View>

      {people.length === 0 ? (
        <EmptyState icon="users" title="No one matches that" message="Try a department chip, or add the person as a new record." />
      ) : null}

      <Pressable onPress={onAdd} style={[styles.addButton, { borderColor: theme.border }]}>
        <Icon name="plus" size={16} color={theme.accentDeep} />
        <Text style={[styles.addLabel, { color: theme.accentDeep }]}>Add employee</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  summaryCard: { padding: 17, gap: 13 },
  summaryTopRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 14 },
  gap6: { gap: 6 },
  alignEnd: { alignItems: 'flex-end' },
  eyebrow: { fontFamily: fontFamily.mono, fontSize: 10, letterSpacing: 0.12 * 10, textTransform: 'uppercase' },
  activeValue: { fontSize: 30, fontWeight: '600', letterSpacing: -0.03 * 30, lineHeight: 30 },
  netValue: { fontSize: 19, fontWeight: '600', letterSpacing: -0.02 * 19, lineHeight: 19 },
  divider: { height: 1 },
  rollRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rollNote: { flex: 1, fontFamily: fontFamily.mono, fontSize: 10.5, lineHeight: 10.5 * 1.4 },
  runStatus: { fontSize: 11.5, fontWeight: '600', flexShrink: 0 },

  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 48, paddingHorizontal: 14, borderRadius: 16, borderWidth: 1 },
  searchInput: { flex: 1, fontSize: 14.5, padding: 0 },
  clearButton: { width: 26, height: 26, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },

  chipsRow: { gap: 7 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 32, paddingHorizontal: 13, borderRadius: 999, borderWidth: 1 },
  chipLabel: { fontFamily: fontFamily.semibold, fontSize: 12.5 },
  chipCount: { fontFamily: fontFamily.mono, fontSize: 10.5, opacity: 0.85 },

  peopleGroup: { gap: 8 },

  addButton: { height: 50, borderRadius: 16, borderWidth: 1, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  addLabel: { fontFamily: fontFamily.semibold, fontSize: 14.5 },
});
