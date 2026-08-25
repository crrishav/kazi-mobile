import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { Avatar } from '@/components/ui/avatar';
import { useTheme } from '@/theme/theme-provider';
import { fontFamily, tabularNums } from '@/theme';
import { STATUS_LABELS, STATUS_RAMP } from '@/data/attendance/mock';
import type { TeamMember } from '@/data/attendance/types';

export interface TeamRowProps {
  member: TeamMember;
  index: number;
}

export function TeamRow({ member, index }: TeamRowProps) {
  const theme = useTheme();
  const tone = STATUS_RAMP[theme.scheme][member.status];

  return (
    <Animated.View entering={FadeInUp.delay(Math.min(index, 6) * 30).duration(200)}>
      <View style={[styles.row, { backgroundColor: theme.surface, boxShadow: theme.shadows.card }]}>
        <Avatar initials={member.initials} tint={member.avatarTint} size="lg" />
        <View style={styles.textWrap}>
          <Text style={[styles.name, { color: theme.textPrimary }]} numberOfLines={1}>
            {member.name}
          </Text>
          <View style={styles.subRow}>
            <Text style={[styles.meta, tabularNums, { color: theme.textSecondary }]} numberOfLines={1}>
              {member.times}
            </Text>
            <Text style={[styles.dot, { color: theme.textSecondary }]}>·</Text>
            <Text style={[styles.meta, { color: theme.textSecondary }]} numberOfLines={1}>
              {member.role}
            </Text>
          </View>
        </View>
        <View style={styles.rightCol}>
          <View style={[styles.pill, { backgroundColor: tone.chipBg }]}>
            <View style={[styles.pillDot, { backgroundColor: tone.dot }]} />
            <Text style={[styles.pillLabel, { color: tone.chipFg }]}>{STATUS_LABELS[member.status]}</Text>
          </View>
          <Text style={[styles.hours, tabularNums, { color: theme.textPrimary }]}>{member.hours}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 18, padding: 14 },
  textWrap: { flex: 1, gap: 4, minWidth: 0 },
  name: { fontFamily: fontFamily.semibold, fontSize: 15 },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 0 },
  meta: { fontFamily: fontFamily.mono, fontSize: 11, flexShrink: 1 },
  dot: { fontFamily: fontFamily.mono, fontSize: 11, opacity: 0.6 },
  rightCol: { alignItems: 'flex-end', gap: 5, flexShrink: 0 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 26, paddingHorizontal: 10, borderRadius: 999 },
  pillDot: { width: 6, height: 6, borderRadius: 99 },
  pillLabel: { fontSize: 12, fontWeight: '600' },
  hours: { fontSize: 12, fontWeight: '600' },
});
