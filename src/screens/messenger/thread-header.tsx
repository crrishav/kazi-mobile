import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/avatar';
import { Icon } from '@/components/ui/icon';
import { useTheme } from '@/theme/theme-provider';
import { fontFamily } from '@/theme';
import type { Person } from '@/data/messenger/types';

export interface ThreadHeaderProps {
  person: Person | null;
  onBack: () => void;
}

/** A person-identity layout (avatar + name + presence inline), not a title/subtitle stack — doesn't fit `ScreenHeader`'s shape, so it's bespoke like `DirectorSheet`'s header. */
export function ThreadHeader({ person, onBack }: ThreadHeaderProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.row, { paddingTop: insets.top + 10, borderBottomColor: theme.border, backgroundColor: theme.surfaceRaised }]}>
      <Pressable onPress={onBack} hitSlop={8} style={[styles.backButton, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Icon name="chevron-left" size={18} color={theme.textPrimary} />
      </Pressable>

      {person ? (
        <View style={styles.identity}>
          <Avatar initials={person.initials} tint={person.avatarTint} size="md" />
          <View style={styles.textWrap}>
            <Text style={[styles.name, { color: theme.textPrimary }]} numberOfLines={1}>
              {person.name}
            </Text>
            <View style={styles.statusRow}>
              <View style={[styles.dot, { backgroundColor: person.online ? theme.accent : theme.draftDot }]} />
              <Text style={[styles.status, { color: theme.textSecondary }]} numberOfLines={1}>
                {person.status}
              </Text>
            </View>
          </View>
        </View>
      ) : (
        <Text style={[styles.fallbackTitle, { color: theme.textPrimary }]}>Thread</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  identity: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    minWidth: 0,
  },
  textWrap: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  name: {
    fontFamily: fontFamily.semibold,
    fontSize: 16,
    letterSpacing: -0.01 * 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 99,
  },
  status: {
    fontFamily: fontFamily.mono,
    fontSize: 10,
    letterSpacing: 0.1 * 10,
    textTransform: 'uppercase',
  },
  fallbackTitle: {
    flex: 1,
    fontFamily: fontFamily.semibold,
    fontSize: 16,
  },
});
