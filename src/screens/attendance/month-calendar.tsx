import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/theme-provider';
import { fontFamily, tabularNums } from '@/theme';
import { BS_MONTHS_EN, bsFromAD } from '@/lib/nepaliDate';
import { MONTH_ISO_END, MONTH_ISO_START, MONTH_LABEL, STATUS_LABELS, STATUS_RAMP, WEEKDAYS, WORKING_DAYS } from '@/data/attendance/mock';
import { buildMonthDays } from '@/data/attendance/utils';
import type { AttendanceStatus } from '@/data/attendance/types';

const LEGEND_STATUSES: AttendanceStatus[] = ['present', 'late', 'absent', 'half', 'leave'];

/** BS span covering the displayed AD month, e.g. "Shrawan–Bhadra 2083 BS". */
function bsSpanLabel(): string {
  const a = bsFromAD(MONTH_ISO_START);
  const b = bsFromAD(MONTH_ISO_END);
  const from = BS_MONTHS_EN[a.month - 1];
  const to = BS_MONTHS_EN[b.month - 1];
  if (a.year === b.year && a.month === b.month) return `${from} ${a.year} BS`;
  return `${from} ${a.date}–${to} ${b.date}, ${b.year} BS`;
}

export function MonthCalendar() {
  const theme = useTheme();
  const ramp = STATUS_RAMP[theme.scheme];
  const days = buildMonthDays();
  const bsSpan = bsSpanLabel();

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, boxShadow: theme.shadows.card }]}>
      <View style={styles.headerRow}>
        <View style={styles.titleWrap}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>{MONTH_LABEL}</Text>
          <Text style={[styles.bsLabel, { color: theme.textSecondary }]}>{bsSpan}</Text>
        </View>
        <Text style={[styles.workingDays, tabularNums, { color: theme.textSecondary }]}>{WORKING_DAYS} working days</Text>
      </View>

      <View style={styles.grid}>
        {WEEKDAYS.map((w) => (
          <View key={w} style={styles.weekdayCell}>
            <Text style={[styles.weekdayLabel, { color: theme.textSecondary }]}>{w}</Text>
          </View>
        ))}
        {days.map((d, i) => {
          let bg = 'transparent';
          let fg = theme.textSecondary;
          if (d.status === 'off') {
            bg = theme.draftWash;
            fg = theme.textSecondary;
          } else if (d.status === 'future') {
            bg = theme.surfaceRaised;
            fg = theme.textSecondary;
          } else if (d.status) {
            bg = ramp[d.status].cellBg;
            fg = ramp[d.status].cellFg;
          }
          return (
            <View
              key={i}
              style={[
                styles.dayCell,
                { backgroundColor: bg, borderWidth: d.isToday ? 2 : 0, borderColor: theme.surfaceInverted },
              ]}
            >
              <Text style={[styles.dayLabel, tabularNums, { color: fg, fontWeight: d.isToday ? '700' : '500' }]}>{d.day ?? ''}</Text>
            </View>
          );
        })}
      </View>

      <View style={styles.legendRow}>
        {LEGEND_STATUSES.map((s) => (
          <View key={s} style={styles.legendItem}>
            <View style={[styles.legendSwatch, { backgroundColor: ramp[s].cellBg }]} />
            <Text style={[styles.legendLabel, { color: theme.textPrimary }]}>{STATUS_LABELS[s]}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 20, padding: 18, gap: 14 },
  headerRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 },
  titleWrap: { gap: 2, flexShrink: 1 },
  title: { fontFamily: fontFamily.semibold, fontSize: 15 },
  bsLabel: { fontFamily: fontFamily.mono, fontSize: 10, letterSpacing: 0.08 * 10 },
  workingDays: { fontFamily: fontFamily.mono, fontSize: 11, flexShrink: 0 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  weekdayCell: { width: '12.5%', flexGrow: 1, alignItems: 'center', paddingBottom: 2 },
  weekdayLabel: { fontFamily: fontFamily.mono, fontSize: 9.5, letterSpacing: 0.1 * 9.5, textTransform: 'uppercase' },
  dayCell: { width: '12.5%', flexGrow: 1, aspectRatio: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  dayLabel: { fontSize: 12.5 },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingTop: 2 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendSwatch: { width: 9, height: 9, borderRadius: 3 },
  legendLabel: { fontSize: 11.5 },
});
