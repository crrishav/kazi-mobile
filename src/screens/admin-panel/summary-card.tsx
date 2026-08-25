import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/theme-provider';
import { fontFamily } from '@/theme';
import type { AccessLevel, Role } from '@/data/admin-panel/types';

export interface SummaryCardProps {
  role: Role;
  dirty: boolean;
  pendingCount: number;
  counts: Record<AccessLevel, number>;
}

/** The one inverted "highlight" card per screen — role identity + in-effect/unsaved state + the edit/view/hidden breakdown. */
export function SummaryCard({ role, dirty, pendingCount, counts }: SummaryCardProps) {
  const theme = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: theme.surfaceInverted }]}>
      <View style={styles.headRow}>
        <View style={styles.headText}>
          <Text style={[styles.roleName, { color: theme.onDark.text }]} numberOfLines={1}>
            {role.label}
          </Text>
          <Text style={[styles.roleMeta, { color: theme.onDark.textMuted }]} numberOfLines={1}>
            {role.people} people · {role.meta}
          </Text>
        </View>
        <View
          style={[
            styles.stateChip,
            { backgroundColor: dirty ? theme.onDark.warningWash : theme.onDark.accentWash },
          ]}
        >
          <View style={[styles.stateDot, { backgroundColor: dirty ? theme.onDark.warningWashText : theme.onDark.accentWashText }]} />
          <Text style={[styles.stateLabel, { color: dirty ? theme.onDark.warningWashText : theme.onDark.accentWashText }]}>
            {dirty ? `${pendingCount} unsaved` : 'In effect'}
          </Text>
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: theme.onDark.textMuted }]} />

      <View style={styles.countsRow}>
        <CountCell label="Can edit" value={counts[2]} theme={theme} />
        <CountCell label="View only" value={counts[1]} theme={theme} />
        <CountCell label="Hidden" value={counts[0]} theme={theme} />
      </View>
    </View>
  );
}

function CountCell({ label, value, theme }: { label: string; value: number; theme: ReturnType<typeof useTheme> }) {
  return (
    <View style={styles.countCell}>
      <Text style={[styles.countLabel, { color: theme.onDark.textMuted }]}>{label}</Text>
      <Text style={[styles.countValue, { color: theme.onDark.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 17,
    gap: 12,
  },
  headRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headText: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  roleName: {
    fontFamily: fontFamily.semibold,
    fontSize: 16,
    letterSpacing: -0.01 * 16,
  },
  roleMeta: {
    fontFamily: fontFamily.mono,
    fontSize: 10.5,
  },
  stateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 26,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  stateDot: {
    width: 6,
    height: 6,
    borderRadius: 99,
  },
  stateLabel: {
    fontFamily: fontFamily.semibold,
    fontSize: 11.5,
  },
  divider: {
    height: 1,
    opacity: 0.14,
  },
  countsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  countCell: {
    flex: 1,
    gap: 5,
  },
  countLabel: {
    fontFamily: fontFamily.mono,
    fontSize: 9.5,
    letterSpacing: 0.1 * 9.5,
    textTransform: 'uppercase',
  },
  countValue: {
    fontFamily: fontFamily.semibold,
    fontSize: 17,
    letterSpacing: -0.02 * 17,
  },
});
