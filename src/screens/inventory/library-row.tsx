import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { useTheme } from '@/theme/theme-provider';
import { fontFamily } from '@/theme';
import type { LibraryItem } from '@/data/inventory/types';

export interface LibraryGroupProps {
  title: string;
  items: LibraryItem[];
  onOpen: (item: LibraryItem) => void;
}

export function LibraryGroup({ title, items, onOpen }: LibraryGroupProps) {
  const theme = useTheme();

  return (
    <View style={styles.group}>
      <View style={styles.groupHeader}>
        <Text style={[styles.groupTitle, { color: theme.textSecondary }]}>{title}</Text>
        <Text style={[styles.groupCount, { color: theme.textSecondary }]}>{items.length}</Text>
      </View>
      {items.map((item) => (
        <Pressable
          key={item.id}
          onPress={() => onOpen(item)}
          style={[styles.row, { backgroundColor: theme.surface, boxShadow: theme.shadows.card }]}
        >
          <View style={[styles.thumb, { borderColor: theme.border }]}>
            <Text style={[styles.thumbLabel, { color: theme.textSecondary }]}>{item.kind}</Text>
          </View>
          <View style={styles.textWrap}>
            <Text style={[styles.name, { color: theme.textPrimary }]} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={[styles.meta, { color: theme.textSecondary }]}>{item.meta}</Text>
            <View style={styles.tagsRow}>
              {item.tags.map((tag) => (
                <View key={tag} style={[styles.tag, { backgroundColor: theme.draftWash, borderColor: theme.border }]}>
                  <Text style={[styles.tagLabel, { color: theme.textSecondary }]}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
          <Icon name="chevron-right" size={16} color={theme.textSecondary} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: 10,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  groupTitle: {
    fontFamily: fontFamily.mono,
    fontSize: 10.5,
    letterSpacing: 0.12 * 10.5,
    textTransform: 'uppercase',
  },
  groupCount: {
    fontFamily: fontFamily.mono,
    fontSize: 10.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 18,
    padding: 13,
  },
  thumb: {
    width: 52,
    height: 64,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: 5,
  },
  thumbLabel: {
    fontFamily: fontFamily.mono,
    fontSize: 8,
    letterSpacing: 0.08 * 8,
    textTransform: 'uppercase',
  },
  textWrap: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  name: {
    fontFamily: fontFamily.semibold,
    fontSize: 15,
  },
  meta: {
    fontFamily: fontFamily.mono,
    fontSize: 10.5,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingTop: 1,
  },
  tag: {
    height: 22,
    paddingHorizontal: 8,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagLabel: {
    fontSize: 11,
  },
});
