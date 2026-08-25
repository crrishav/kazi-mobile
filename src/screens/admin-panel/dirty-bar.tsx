import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { useTheme } from '@/theme/theme-provider';
import { fontFamily, radii } from '@/theme';

export interface DirtyBarProps {
  count: number;
  peopleCount: number;
  onDiscard: () => void;
  onReview: () => void;
}

/** Persistent floating bar (not a toast) while edits are staged — mirrors the design's own bottom:104 pending-changes bar, which sits at the same spot the toast uses since the two are never meant to be read at once. */
export function DirtyBar({ count, peopleCount, onDiscard, onReview }: DirtyBarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Animated.View
      entering={FadeInDown.duration(200)}
      exiting={FadeOutDown.duration(180)}
      style={[styles.wrap, { bottom: insets.bottom + 16 }]}
    >
      <View style={[styles.bar, { backgroundColor: theme.surfaceInverted, boxShadow: theme.shadows.floating }]}>
        <View style={styles.textWrap}>
          <Text style={[styles.title, { color: theme.onDark.text }]} numberOfLines={1}>
            {count === 1 ? '1 change pending' : `${count} changes pending`}
          </Text>
          <Text style={[styles.meta, { color: theme.onDark.textMuted }]} numberOfLines={1}>
            Not applied · {peopleCount} people affected
          </Text>
        </View>
        <Pressable
          onPress={onDiscard}
          style={[styles.discard, { borderColor: theme.onDark.textMuted }]}
        >
          <Text style={[styles.discardLabel, { color: theme.onDark.text }]}>Discard</Text>
        </Pressable>
        <Button label="Review" variant="primary" size="small" onPress={onReview} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 14,
    right: 14,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: radii.xl - 4,
    padding: 12,
    paddingLeft: 16,
  },
  textWrap: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  title: {
    fontFamily: fontFamily.semibold,
    fontSize: 14,
  },
  meta: {
    fontFamily: fontFamily.mono,
    fontSize: 10.5,
  },
  discard: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discardLabel: {
    fontFamily: fontFamily.semibold,
    fontSize: 13.5,
  },
});
