import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { Switch } from '@/components/ui/switch';
import { useTheme } from '@/theme/theme-provider';
import { fontFamily, radii, type Theme } from '@/theme';
import { HIDDEN_CHIP_FG } from '@/data/admin-panel/mock';
import type { AccessLevel, SectionDef, SectionGroup } from '@/data/admin-panel/types';

export interface SectionGroupCardProps {
  group: SectionGroup;
  index: number;
  levelOf: (id: SectionDef['id']) => AccessLevel;
  lockOf: (item: SectionDef) => string | null;
  isChanged: (id: SectionDef['id']) => boolean;
  onToggle: (item: SectionDef, lock: string | null) => void;
  onLevel: (item: SectionDef, lock: string | null) => void;
}

function chipPalette(theme: Theme, level: AccessLevel, locked: boolean) {
  const lv = locked ? 0 : level;
  if (lv === 2) return { bg: theme.accentWash, fg: theme.accentWashText };
  if (lv === 1) return { bg: theme.surfaceRaised, fg: theme.textSecondary };
  return { bg: theme.surface, fg: HIDDEN_CHIP_FG[theme.scheme] };
}

export function SectionGroupCard({ group, index, levelOf, lockOf, isChanged, onToggle, onLevel }: SectionGroupCardProps) {
  const theme = useTheme();
  const visibleCount = group.items.filter((it) => levelOf(it.id) > 0).length;

  return (
    <Animated.View entering={FadeInUp.delay(index * 40).duration(220)} style={styles.group}>
      <View style={styles.groupHead}>
        <Text style={[styles.groupTitle, { color: theme.textPrimary }]}>{group.title}</Text>
        <Text style={[styles.groupMeta, { color: theme.textSecondary }]}>
          {visibleCount} of {group.items.length} visible
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: theme.surface, boxShadow: theme.shadows.card }]}>
        {group.items.map((item, i) => {
          const lock = lockOf(item);
          const lv = levelOf(item.id);
          const chip = chipPalette(theme, lv, !!lock);
          const changed = isChanged(item.id);
          const levelLabel = lock ? 'locked' : lv === 2 ? 'can edit' : lv === 1 ? 'view only' : 'hidden';

          return (
            <View
              key={item.id}
              style={[
                styles.row,
                i > 0 ? { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.border } : null,
                { backgroundColor: lock ? theme.surfaceRaised : changed ? theme.accentWash : theme.surface },
              ]}
            >
              <View style={styles.rowText}>
                <Text style={[styles.rowName, { color: lock ? theme.textSecondary : theme.textPrimary }]} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={[styles.rowNote, { color: theme.textSecondary }]} numberOfLines={1}>
                  {lock ? `locked · ${lock}` : item.note}
                </Text>
              </View>
              <Pressable
                onPress={() => onLevel(item, lock)}
                style={[styles.levelChip, { backgroundColor: chip.bg, borderColor: theme.border }]}
              >
                <Text style={[styles.levelLabel, { color: chip.fg }]}>{levelLabel}</Text>
              </Pressable>
              <Switch value={lv > 0 && !lock} onValueChange={() => onToggle(item, lock)} />
            </View>
          );
        })}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: 9,
  },
  groupHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 9,
    paddingHorizontal: 2,
  },
  groupTitle: {
    fontFamily: fontFamily.semibold,
    fontSize: 15,
    letterSpacing: -0.01 * 15,
  },
  groupMeta: {
    fontFamily: fontFamily.mono,
    fontSize: 10.5,
  },
  card: {
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingVertical: 13,
    paddingHorizontal: 15,
  },
  rowText: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  rowName: {
    fontFamily: fontFamily.semibold,
    fontSize: 15,
  },
  rowNote: {
    fontFamily: fontFamily.mono,
    fontSize: 10.5,
  },
  levelChip: {
    height: 28,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelLabel: {
    fontFamily: fontFamily.mono,
    fontSize: 10,
    letterSpacing: 0.1 * 10,
    textTransform: 'uppercase',
  },
});
