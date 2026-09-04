import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { Avatar } from '@/components/ui/avatar';
import { useTheme } from '@/theme/theme-provider';
import { fontFamily } from '@/theme';
import type { Person } from '@/data/chat/types';

export interface ThreadRowProps {
  person: Person;
  preview: string;
  unread: number;
  time: string;
  index: number;
  onPress: () => void;
}

export function ThreadRow({ person, preview, unread, time, index, onPress }: ThreadRowProps) {
  const theme = useTheme();

  return (
    <Animated.View entering={FadeInUp.delay(index * 30).duration(220)}>
      <Pressable onPress={onPress} style={[styles.row, { backgroundColor: theme.surface, boxShadow: theme.shadows.card }]}>
        <View style={styles.avatarWrap}>
          <Avatar initials={person.initials} tint={person.avatarTint} size="lg" />
          <View
            style={[
              styles.presenceDot,
              { backgroundColor: person.online ? theme.accent : theme.draftDot, borderColor: theme.surface },
            ]}
          />
        </View>

        <View style={styles.textWrap}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: theme.textPrimary }]} numberOfLines={1}>
              {person.name}
            </Text>
            <Text style={[styles.role, { color: theme.textSecondary }]} numberOfLines={1}>
              {person.role}
            </Text>
          </View>
          <Text
            style={[
              styles.preview,
              { color: unread ? theme.textPrimary : theme.textSecondary, fontFamily: unread ? fontFamily.semibold : fontFamily.regular },
            ]}
            numberOfLines={1}
          >
            {preview}
          </Text>
        </View>

        <View style={styles.metaWrap}>
          <Text style={[styles.time, { color: theme.textSecondary }]} numberOfLines={1}>
            {time}
          </Text>
          {unread > 0 ? (
            <View style={[styles.badge, { backgroundColor: theme.accent }]}>
              <Text style={[styles.badgeLabel, { color: theme.accentText }]}>{unread}</Text>
            </View>
          ) : (
            <View style={styles.badgeSpacer} />
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 18,
    padding: 14,
  },
  avatarWrap: {
    flexShrink: 0,
  },
  presenceDot: {
    position: 'absolute',
    right: -3,
    bottom: -3,
    width: 13,
    height: 13,
    borderRadius: 99,
    borderWidth: 2.5,
  },
  textWrap: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  name: {
    fontFamily: fontFamily.semibold,
    fontSize: 15,
    flexShrink: 1,
  },
  role: {
    fontFamily: fontFamily.mono,
    fontSize: 10,
    letterSpacing: 0.1 * 10,
    textTransform: 'uppercase',
    flexShrink: 0,
  },
  preview: {
    fontSize: 13.5,
  },
  metaWrap: {
    alignItems: 'flex-end',
    gap: 6,
    flexShrink: 0,
  },
  time: {
    fontFamily: fontFamily.mono,
    fontSize: 10.5,
  },
  badge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 99,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeLabel: {
    fontFamily: fontFamily.semibold,
    fontSize: 11,
  },
  badgeSpacer: {
    height: 20,
  },
});
