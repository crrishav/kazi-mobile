import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { Avatar } from '@/components/ui/avatar';
import { useTheme } from '@/theme/theme-provider';
import { fontFamily } from '@/theme';
import type { Director } from '@/data/directors/types';

export interface PersonRowProps {
  person: Director;
  index: number;
  onPress: () => void;
}

export function PersonRow({ person, index, onPress }: PersonRowProps) {
  const theme = useTheme();

  return (
    <Animated.View entering={FadeInUp.delay(Math.min(index, 6) * 30).duration(200)}>
      <Pressable onPress={onPress} style={[styles.row, { backgroundColor: theme.surface, boxShadow: theme.shadows.card }]}>
        <Avatar initials={person.avatarInitials} tint={person.avatarTint} size="lg" />
        <View style={styles.textWrap}>
          <Text style={[styles.name, { color: theme.textPrimary }]} numberOfLines={1}>
            {person.name}
          </Text>
          <View style={styles.subRow}>
            <Text style={[styles.role, { color: theme.textSecondary }]} numberOfLines={1}>
              {person.role}
            </Text>
            <Text style={[styles.since, { color: theme.textSecondary }]}>{person.since}</Text>
          </View>
        </View>
        <Text style={[styles.tag, { color: theme.textSecondary }]}>{person.tag}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 18, padding: 14 },
  textWrap: { flex: 1, gap: 4, minWidth: 0 },
  name: { fontFamily: fontFamily.semibold, fontSize: 15 },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: 7, minWidth: 0 },
  role: { fontSize: 12.5, flexShrink: 1 },
  since: { fontFamily: fontFamily.mono, fontSize: 11, flexShrink: 0, opacity: 0.75 },
  tag: { fontFamily: fontFamily.mono, fontSize: 10, letterSpacing: 0.1 * 10, textTransform: 'uppercase', flexShrink: 0, opacity: 0.85 },
});
