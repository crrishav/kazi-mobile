import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { Avatar } from '@/components/ui/avatar';
import { Icon } from '@/components/ui/icon';
import { SegmentedProportionBar } from '@/components/ui/segmented-proportion-bar';
import { StatusPill, type StatusKind } from '@/components/ui/status-pill';
import { useTheme } from '@/theme/theme-provider';
import { fontFamily, tabularNums } from '@/theme';
import { PEOPLE, STAGES, STATUS_LABEL, stageRampDark, stageRampLight } from '@/data/production/mock';
import type { Batch, BatchStatus } from '@/data/production/types';
import { segmentColors, stageIndexOf } from '@/data/production/utils';

const PILL_KIND: Record<BatchStatus, StatusKind> = {
  active: 'on-track',
  hold: 'at-risk',
  cancelled: 'blocked',
  done: 'shipped',
};

export interface BatchCardProps {
  batch: Batch;
  index: number;
  onPress: () => void;
}

export function BatchCard({ batch, index, onPress }: BatchCardProps) {
  const theme = useTheme();
  const ramp = theme.scheme === 'dark' ? stageRampDark : stageRampLight;
  const person = PEOPLE.find((p) => p.id === batch.person) ?? PEOPLE[0];
  const stageIndex = stageIndexOf(batch);
  const stage = STAGES[stageIndex] ?? STAGES[0];
  const cancelled = batch.status === 'cancelled';

  const segments = segmentColors(batch, ramp, theme.draftWash, theme.dangerWash).map((color) => ({ weight: 1, color }));

  return (
    <Animated.View entering={FadeInUp.delay(Math.min(index, 6) * 30).duration(220)}>
      <Pressable
        onPress={onPress}
        style={[styles.card, { backgroundColor: theme.surface, boxShadow: theme.shadows.card }]}
      >
        <View style={styles.topRow}>
          <View style={styles.titleWrap}>
            <Text style={[styles.title, { color: cancelled ? theme.textSecondary : theme.textPrimary }]} numberOfLines={1}>
              {batch.product}
            </Text>
            <Text style={[styles.meta, tabularNums, { color: theme.textSecondary }]} numberOfLines={1}>
              {batch.code} · {batch.qty} · due {batch.due}
            </Text>
          </View>
          <StatusPill status={PILL_KIND[batch.status]} label={STATUS_LABEL[batch.status]} />
        </View>

        <SegmentedProportionBar segments={segments} height={6} />

        <View style={styles.bottomRow}>
          <View style={styles.personRow}>
            <Avatar initials={person.initials} tint={person.tint} size="sm" />
            <Text style={[styles.stageLabel, { color: theme.textPrimary }]} numberOfLines={1}>
              {stage.label}
            </Text>
          </View>
          <View style={styles.countsRow}>
            <View style={styles.countChip}>
              <Icon name="camera" size={13} color={theme.textSecondary} />
              <Text style={[styles.countText, tabularNums, { color: theme.textSecondary }]}>{batch.photos.length}</Text>
            </View>
            <View style={styles.countChip}>
              <Icon name="message-square" size={13} color={theme.textSecondary} />
              <Text style={[styles.countText, tabularNums, { color: theme.textSecondary }]}>{batch.notes.length}</Text>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 16,
    gap: 13,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  titleWrap: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  title: {
    fontFamily: fontFamily.semibold,
    fontSize: 16,
    letterSpacing: -0.01 * 16,
  },
  meta: {
    fontFamily: fontFamily.mono,
    fontSize: 11,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
    flexShrink: 1,
  },
  stageLabel: {
    fontSize: 13,
    flexShrink: 1,
  },
  countsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    flexShrink: 0,
  },
  countChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  countText: {
    fontFamily: fontFamily.mono,
    fontSize: 11,
  },
});
