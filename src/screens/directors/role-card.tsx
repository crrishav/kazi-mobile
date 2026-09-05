import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { Icon } from '@/components/ui/icon';
import { useTheme } from '@/theme/theme-provider';
import { fontFamily, tabularNums } from '@/theme';
import type { Role } from '@/data/directors/types';

import { HolderRow } from './holder-row';

export interface RoleCardProps {
  role: Role;
  index: number;
  onPress: () => void;
}

export function RoleCard({ role, index, onPress }: RoleCardProps) {
  const theme = useTheme();
  const editable = role.sections.filter((s) => s.canEdit).length;

  return (
    <Animated.View entering={FadeInUp.delay(Math.min(index, 6) * 30).duration(200)}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${role.label}, ${role.holders.length} ${role.holders.length === 1 ? 'person' : 'people'}`}
        style={[styles.card, { backgroundColor: theme.surface, boxShadow: theme.shadows.card }]}
      >
        <Text style={[styles.label, { color: theme.textPrimary }]} numberOfLines={2}>
          {role.label}
        </Text>

        {role.description ? (
          <Text style={[styles.description, { color: theme.textSecondary }]}>{role.description}</Text>
        ) : null}

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        {role.holders.length ? (
          <View style={styles.holders}>
            {role.holders.map((h) => (
              <HolderRow key={h.id} holder={h} />
            ))}
          </View>
        ) : (
          <Text style={[styles.vacant, { color: theme.textSecondary }]}>Nobody holds this role</Text>
        )}

        <View style={styles.footRow}>
          <Text style={[styles.foot, tabularNums, { color: theme.textSecondary }]}>
            {role.sections.length} sections · {editable} editable
          </Text>
          <Icon name="chevron-right" size={15} color={theme.textSecondary} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 18, padding: 15, gap: 10 },
  label: { fontFamily: fontFamily.semibold, fontSize: 15.5, letterSpacing: -0.01 * 15.5 },
  description: { fontSize: 13, lineHeight: 13 * 1.5 },
  divider: { height: StyleSheet.hairlineWidth },
  holders: { gap: 10 },
  vacant: { fontSize: 12.5, fontStyle: 'italic', opacity: 0.85 },
  footRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  foot: { flex: 1, fontFamily: fontFamily.mono, fontSize: 10.5, letterSpacing: 0.08 * 10.5, textTransform: 'uppercase' },
});
