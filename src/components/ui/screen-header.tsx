import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/theme-provider';
import { fontFamily } from '@/theme';

import { Icon } from './icon';

export interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  /** Overrides the default `router.back()` — e.g. a detail view stepping back to its own list instead of exiting the module. */
  onBack?: () => void;
  rightSlot?: React.ReactNode;
}

/** Used by every pushed module screen (the design's headers aren't native-header shapes, so native headers stay off throughout). */
export function ScreenHeader({ title, subtitle, showBack = true, onBack, rightSlot }: ScreenHeaderProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.row, { paddingTop: insets.top + 12, borderBottomColor: theme.border, backgroundColor: theme.background }]}>
      {showBack ? (
        <Pressable
          onPress={onBack ?? (() => router.back())}
          hitSlop={8}
          style={[styles.backButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
        >
          <Icon name="chevron-left" size={20} color={theme.textPrimary} />
        </Pressable>
      ) : (
        <View style={styles.backButton} />
      )}
      <View style={styles.titleWrap}>
        <Text style={[styles.title, { color: theme.textPrimary }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: theme.textSecondary }]} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View style={styles.rightSlot}>{rightSlot}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrap: {
    flex: 1,
    gap: 1,
  },
  title: {
    fontFamily: fontFamily.semibold,
    fontSize: 20,
    letterSpacing: -0.015 * 20,
  },
  subtitle: {
    fontFamily: fontFamily.mono,
    fontSize: 10.5,
    letterSpacing: 0.1 * 10.5,
    textTransform: 'uppercase',
  },
  rightSlot: {
    minWidth: 36,
    alignItems: 'flex-end',
  },
});
