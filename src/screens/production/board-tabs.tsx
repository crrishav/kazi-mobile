import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/theme-provider';
import { fontFamily } from '@/theme';
import type { ProductionView } from '@/data/production/types';

export interface BoardTabsProps {
  view: ProductionView;
  onList: () => void;
  onCalendar: () => void;
}

export function BoardTabs({ view, onList, onCalendar }: BoardTabsProps) {
  const theme = useTheme();

  return (
    <View style={styles.wrap}>
      <View style={[styles.segmented, { backgroundColor: theme.draftWash, borderColor: theme.border }]}>
        <Pressable
          onPress={onList}
          style={[
            styles.segmentButton,
            { backgroundColor: view === 'list' ? theme.surface : 'transparent', boxShadow: view === 'list' ? theme.shadows.card : undefined },
          ]}
        >
          <Text style={[styles.segmentLabel, { color: view === 'list' ? theme.textPrimary : theme.textSecondary }]}>Batches</Text>
        </Pressable>
        <Pressable
          onPress={onCalendar}
          style={[
            styles.segmentButton,
            { backgroundColor: view === 'calendar' ? theme.surface : 'transparent', boxShadow: view === 'calendar' ? theme.shadows.card : undefined },
          ]}
        >
          <Text style={[styles.segmentLabel, { color: view === 'calendar' ? theme.textPrimary : theme.textSecondary }]}>Schedule</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
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
});
