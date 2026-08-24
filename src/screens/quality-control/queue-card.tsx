import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp, LinearTransition } from 'react-native-reanimated';

import { Icon } from '@/components/ui/icon';
import { useTheme } from '@/theme/theme-provider';
import { fontFamily, tabularNums } from '@/theme';
import { PRIORITY } from '@/data/quality-control/mock';
import type { QueueItem } from '@/data/quality-control/types';

export interface QueueCardProps {
  item: QueueItem;
  index: number;
  onOpen: () => void;
  onPass: () => void;
  onFlag: () => void;
  onFail: () => void;
}

export function QueueCard({ item, index, onOpen, onPass, onFlag, onFail }: QueueCardProps) {
  const theme = useTheme();
  const priority = PRIORITY[item.priority];

  return (
    <Animated.View
      entering={FadeInUp.delay(Math.min(index, 6) * 30).duration(220)}
      exiting={FadeOutUp.duration(190)}
      layout={LinearTransition.duration(200)}
      style={[styles.card, { backgroundColor: theme.surface, boxShadow: theme.shadows.card }]}
    >
      <Pressable onPress={onOpen} style={styles.topRow}>
        <View style={styles.textWrap}>
          <Text style={[styles.product, { color: theme.textPrimary }]}>{item.product}</Text>
          <Text style={[styles.meta, tabularNums, { color: theme.textSecondary }]}>
            {item.code} · {item.qty} · sample {item.sample}
          </Text>
          <Text style={[styles.gate, { color: theme.textSecondary }]}>{item.gate}</Text>
        </View>
        <View style={styles.pillCol}>
          <View style={[styles.pill, { backgroundColor: priority.bg }]}>
            <View style={[styles.dot, { backgroundColor: priority.dot }]} />
            <Text style={[styles.pillLabel, { color: priority.fg }]}>{priority.label}</Text>
          </View>
          <Text style={[styles.waiting, tabularNums, { color: theme.textSecondary }]}>waiting {item.waiting}</Text>
        </View>
      </Pressable>

      <View style={styles.actionsRow}>
        <Pressable onPress={onPass} style={[styles.actionButton, { backgroundColor: theme.accentWash, borderColor: theme.scheme === 'light' ? '#BFE4D2' : theme.border }]}>
          <Icon name="check" size={16} color={theme.accentWashText} />
          <Text style={[styles.actionLabel, { color: theme.accentWashText }]}>Pass</Text>
        </Pressable>
        <Pressable onPress={onFlag} style={[styles.actionButton, { backgroundColor: theme.warningWash, borderColor: theme.scheme === 'light' ? '#E8D6AE' : theme.border }]}>
          <Icon name="flag" size={16} color={theme.warningWashText} />
          <Text style={[styles.actionLabel, { color: theme.warningWashText }]}>Flag</Text>
        </Pressable>
        <Pressable onPress={onFail} style={[styles.actionButton, { backgroundColor: theme.surface, borderColor: theme.scheme === 'light' ? '#E3C9BE' : theme.border }]}>
          <Icon name="x" size={16} color={theme.dangerWashText} />
          <Text style={[styles.actionLabel, { color: theme.dangerWashText }]}>Fail</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 20, padding: 16, gap: 13 },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  textWrap: { flex: 1, gap: 5, minWidth: 0 },
  product: { fontFamily: fontFamily.semibold, fontSize: 16, letterSpacing: -0.01 * 16 },
  meta: { fontFamily: fontFamily.mono, fontSize: 11 },
  gate: { fontSize: 13, paddingTop: 2 },
  pillCol: { alignItems: 'flex-end', gap: 6, flexShrink: 0 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 26, paddingHorizontal: 10, borderRadius: 999 },
  dot: { width: 6, height: 6, borderRadius: 99 },
  pillLabel: { fontSize: 12, fontWeight: '600' },
  waiting: { fontFamily: fontFamily.mono, fontSize: 10.5 },
  actionsRow: { flexDirection: 'row', gap: 8 },
  actionButton: { flex: 1, height: 46, borderRadius: 13, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  actionLabel: { fontFamily: fontFamily.semibold, fontSize: 14 },
});
