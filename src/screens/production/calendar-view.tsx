import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { Card } from '@/components/ui/card';
import { useTheme } from '@/theme/theme-provider';
import { fontFamily, tabularNums } from '@/theme';
import { STAGES, stageRampDark, stageRampLight } from '@/data/production/mock';
import type { Batch } from '@/data/production/types';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export interface CalendarViewProps {
  batches: Batch[];
}

export function CalendarView({ batches }: CalendarViewProps) {
  const theme = useTheme();
  const ramp = theme.scheme === 'dark' ? stageRampDark : stageRampLight;

  const days: { label: string; day: number | null; hits: Batch[] }[] = [];
  for (let i = 0; i < 6; i++) days.push({ label: '', day: null, hits: [] });
  for (let d = 1; d <= 31; d++) {
    days.push({ label: String(d), day: d, hits: batches.filter((b) => b.day === d && b.status !== 'cancelled') });
  }

  const schedule = batches
    .filter((b) => b.day >= 24 && b.day <= 30 && b.status !== 'cancelled')
    .sort((a, b) => a.day - b.day)
    .map((b) => {
      const stageIndex = STAGES.findIndex((s) => s.key === b.stage);
      const stage = STAGES[stageIndex] ?? STAGES[0];
      return {
        id: b.id,
        dow: WEEKDAYS[(5 + b.day) % 7],
        day: String(b.day),
        title: b.product,
        meta: `${b.code} · ${b.qty} · ${stage.label}`,
        accent: ramp[Math.max(stageIndex, 0)],
      };
    });

  return (
    <Animated.View entering={FadeInUp.duration(220)} style={styles.wrap}>
      <Card elevation="raised" style={styles.monthCard}>
        <View style={styles.monthHeader}>
          <Text style={[styles.monthTitle, { color: theme.textPrimary }]}>August 2026</Text>
          <Text style={[styles.monthMeta, tabularNums, { color: theme.textSecondary }]}>9 deadlines</Text>
        </View>
        <View style={styles.weekdayRow}>
          {WEEKDAYS.map((w) => (
            <Text key={w} style={[styles.weekday, { color: theme.textSecondary }]}>
              {w}
            </Text>
          ))}
        </View>
        <View style={styles.grid}>
          {days.map((d, i) => {
            const today = d.day === 26;
            const hasHits = d.hits.length > 0;
            const stageIndex = hasHits ? STAGES.findIndex((s) => s.key === d.hits[0].stage) : -1;
            return (
              <View
                key={i}
                style={[
                  styles.cell,
                  {
                    backgroundColor: d.day === null ? 'transparent' : hasHits ? theme.accentWash : theme.surface,
                    borderWidth: today ? 2 : 0,
                    borderColor: theme.surfaceInverted,
                  },
                ]}
              >
                {d.day !== null ? (
                  <>
                    <Text
                      style={[
                        styles.cellLabel,
                        tabularNums,
                        { color: hasHits ? theme.accentWashText : theme.textSecondary, fontFamily: hasHits ? fontFamily.semibold : fontFamily.regular },
                      ]}
                    >
                      {d.label}
                    </Text>
                    {hasHits ? (
                      <View
                        style={[
                          styles.cellMark,
                          { width: d.hits.length > 1 ? 16 : 10, backgroundColor: ramp[Math.max(stageIndex, 0)] },
                        ]}
                      />
                    ) : null}
                  </>
                ) : null}
              </View>
            );
          })}
        </View>
      </Card>

      <View style={styles.weekWrap}>
        <View style={styles.weekHeader}>
          <Text style={[styles.weekTitle, { color: theme.textPrimary }]}>This week</Text>
          <Text style={[styles.weekMeta, { color: theme.textSecondary }]}>24 – 30 Aug</Text>
        </View>
        {schedule.length === 0 ? (
          <Card elevation="raised" style={styles.emptyCard}>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Nothing scheduled this week.</Text>
          </Card>
        ) : (
          schedule.map((s) => (
            <Card key={s.id} elevation="raised" style={styles.scheduleCard}>
              <View style={styles.scheduleDay}>
                <Text style={[styles.scheduleDow, { color: theme.textSecondary }]}>{s.dow}</Text>
                <Text style={[styles.scheduleDate, tabularNums, { color: theme.textPrimary }]}>{s.day}</Text>
              </View>
              <View style={[styles.scheduleAccent, { backgroundColor: s.accent }]} />
              <View style={styles.scheduleTextWrap}>
                <Text style={[styles.scheduleTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                  {s.title}
                </Text>
                <Text style={[styles.scheduleMeta, tabularNums, { color: theme.textSecondary }]} numberOfLines={1}>
                  {s.meta}
                </Text>
              </View>
            </Card>
          ))
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 14,
  },
  monthCard: {
    padding: 18,
    gap: 14,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  monthTitle: {
    fontFamily: fontFamily.semibold,
    fontSize: 15,
  },
  monthMeta: {
    fontFamily: fontFamily.mono,
    fontSize: 11,
  },
  weekdayRow: {
    flexDirection: 'row',
  },
  weekday: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fontFamily.mono,
    fontSize: 9.5,
    letterSpacing: 0.1 * 9.5,
    textTransform: 'uppercase',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  cell: {
    width: '12.5%',
    flexGrow: 1,
    aspectRatio: 1,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  cellLabel: {
    fontSize: 12,
    lineHeight: 12,
  },
  cellMark: {
    height: 3,
    borderRadius: 99,
  },
  weekWrap: {
    gap: 9,
  },
  weekHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  weekTitle: {
    fontFamily: fontFamily.semibold,
    fontSize: 15,
  },
  weekMeta: {
    fontFamily: fontFamily.mono,
    fontSize: 11,
  },
  emptyCard: {
    padding: 18,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
  },
  scheduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  scheduleDay: {
    width: 46,
    alignItems: 'center',
    gap: 2,
  },
  scheduleDow: {
    fontFamily: fontFamily.mono,
    fontSize: 10,
    letterSpacing: 0.1 * 10,
    textTransform: 'uppercase',
  },
  scheduleDate: {
    fontSize: 19,
    fontWeight: '600',
    lineHeight: 19,
  },
  scheduleAccent: {
    width: 3,
    alignSelf: 'stretch',
    borderRadius: 99,
  },
  scheduleTextWrap: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  scheduleTitle: {
    fontFamily: fontFamily.semibold,
    fontSize: 14.5,
  },
  scheduleMeta: {
    fontFamily: fontFamily.mono,
    fontSize: 11,
  },
});
