import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/theme-provider';
import { fontFamily, tabularNums } from '@/theme';

export interface WeeklyHoursProps {
  weeks: { label: string; hours: number; target: number }[];
}

/** Weekly hours-worked bar chart for the "Mine" view (§3.12) — each bar vs its weekly target tick. */
export function WeeklyHours({ weeks }: WeeklyHoursProps) {
  const theme = useTheme();
  const max = Math.max(1, ...weeks.map((w) => Math.max(w.hours, w.target)));
  const targetPerWeek = weeks.length ? Math.round(weeks.reduce((n, w) => n + w.target, 0) / weeks.length) : 0;

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, boxShadow: theme.shadows.card }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Weekly hours</Text>
        <Text style={[styles.meta, tabularNums, { color: theme.textSecondary }]}>≈ {targetPerWeek}h / week target</Text>
      </View>

      <View style={styles.bars}>
        {weeks.map((w) => {
          const fillPct = Math.round((w.hours / max) * 100);
          const tickPct = Math.round((w.target / max) * 100);
          const metTarget = w.hours >= w.target;
          return (
            <View key={w.label} style={styles.col}>
              <View style={[styles.track, { backgroundColor: theme.draftWash }]}>
                <View style={[styles.fill, { height: `${fillPct}%`, backgroundColor: metTarget ? theme.accent : theme.warning }]} />
                <View style={[styles.tick, { bottom: `${tickPct}%`, backgroundColor: theme.textSecondary }]} />
              </View>
              <Text style={[styles.value, tabularNums, { color: theme.textPrimary }]}>{w.hours}</Text>
              <Text style={[styles.label, tabularNums, { color: theme.textSecondary }]} numberOfLines={1}>
                {w.label.replace('Aug ', '')}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 20, padding: 18, gap: 14 },
  headerRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 },
  title: { fontFamily: fontFamily.semibold, fontSize: 15 },
  meta: { fontFamily: fontFamily.mono, fontSize: 10.5 },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, height: 128 },
  col: { flex: 1, alignItems: 'center', gap: 5 },
  track: { width: '100%', flex: 1, borderRadius: 8, overflow: 'hidden', justifyContent: 'flex-end' },
  fill: { width: '100%', borderRadius: 8 },
  tick: { position: 'absolute', left: 0, right: 0, height: 2, opacity: 0.5 },
  value: { fontSize: 12, fontWeight: '600' },
  label: { fontFamily: fontFamily.mono, fontSize: 9, letterSpacing: 0.06 * 9 },
});
