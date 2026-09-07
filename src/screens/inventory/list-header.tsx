import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { ScreenHeader } from '@/components/ui/screen-header';
import { useTheme } from '@/theme/theme-provider';
import { fontFamily } from '@/theme';

export type InventoryTab = 'inventory' | 'library';
export type InventoryFilter = 'all' | 'low' | 'fabric' | 'trim';

export interface ListHeaderProps {
  tab: InventoryTab;
  onTabChange: (tab: InventoryTab) => void;
  headerMeta: string;
  query: string;
  onQueryChange: (q: string) => void;
  searchPlaceholder: string;
  filters?: { id: InventoryFilter; label: string; count: number }[];
  activeFilter?: InventoryFilter;
  onFilterChange?: (f: InventoryFilter) => void;
  /** Inventory is a tab for some positions and a More-hub screen for the rest. */
  showBack?: boolean;
}

export function ListHeader({
  tab,
  onTabChange,
  headerMeta,
  query,
  onQueryChange,
  searchPlaceholder,
  filters,
  activeFilter,
  onFilterChange,
  showBack = false,
}: ListHeaderProps) {
  const theme = useTheme();

  return (
    <View style={{ backgroundColor: theme.background }}>
      {/* The title row is the app's standard root/back header — only the
          controls below it are Inventory's own. */}
      <ScreenHeader title="Inventory" subtitle={headerMeta} showBack={showBack} />

      <View style={styles.wrap}>
        <View style={[styles.segmented, { backgroundColor: theme.draftWash, borderColor: theme.border }]}>
          <Pressable
            onPress={() => onTabChange('inventory')}
            style={[
              styles.segmentButton,
              { backgroundColor: tab === 'inventory' ? theme.surface : 'transparent', boxShadow: tab === 'inventory' ? theme.shadows.card : undefined },
            ]}
          >
            <Text style={[styles.segmentLabel, { color: tab === 'inventory' ? theme.textPrimary : theme.textSecondary }]}>Inventory</Text>
          </Pressable>
          <Pressable
            onPress={() => onTabChange('library')}
            style={[
              styles.segmentButton,
              { backgroundColor: tab === 'library' ? theme.surface : 'transparent', boxShadow: tab === 'library' ? theme.shadows.card : undefined },
            ]}
          >
            <Text style={[styles.segmentLabel, { color: tab === 'library' ? theme.textPrimary : theme.textSecondary }]}>Library</Text>
          </Pressable>
        </View>

        <View style={[styles.searchRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Icon name="search" size={16} color={theme.textSecondary} />
          <View style={styles.searchInputWrap}>
            <SearchInput value={query} onChangeText={onQueryChange} placeholder={searchPlaceholder} />
          </View>
          {query.length > 0 ? (
            <Pressable onPress={() => onQueryChange('')} hitSlop={8}>
              <Text style={[styles.clearLabel, { color: theme.accentDeep }]}>Clear</Text>
            </Pressable>
          ) : null}
        </View>

        {filters ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
            {filters.map((f) => {
              const on = activeFilter === f.id;
              return (
                <Pressable
                  key={f.id}
                  onPress={() => onFilterChange?.(f.id)}
                  style={[styles.chip, { backgroundColor: on ? theme.selectedSurface : theme.surface, borderColor: on ? theme.selectedBorder : theme.border }]}
                >
                  <Text style={[styles.chipLabel, { color: on ? theme.selectedText : theme.textPrimary }]}>{f.label}</Text>
                  <Text style={[styles.chipCount, { color: on ? theme.selectedTextMuted : theme.textSecondary }]}>{f.count}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : null}
      </View>
    </View>
  );
}

// A tiny wrapper keeps the search row's TextInput unstyled-by-default (no
// TextField label/border chrome — it lives inside the pill already).
function SearchInput({ value, onChangeText, placeholder }: { value: string; onChangeText: (v: string) => void; placeholder: string }) {
  const theme = useTheme();
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={theme.textSecondary}
      style={{ fontSize: 14.5, color: theme.textPrimary, fontFamily: fontFamily.regular, padding: 0 }}
    />
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  segmented: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
  },
  segmentButton: {
    flex: 1,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentLabel: {
    fontFamily: fontFamily.semibold,
    fontSize: 13.5,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    height: 46,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  searchInputWrap: {
    flex: 1,
  },
  clearLabel: {
    fontFamily: fontFamily.mono,
    fontSize: 10,
    letterSpacing: 0.08 * 10,
    textTransform: 'uppercase',
  },
  chipsRow: {
    gap: 7,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 32,
    paddingHorizontal: 13,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipLabel: {
    fontFamily: fontFamily.semibold,
    fontSize: 12.5,
  },
  chipCount: {
    fontFamily: fontFamily.mono,
    fontSize: 10.5,
  },
});
