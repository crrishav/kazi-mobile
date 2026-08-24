import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { useTheme } from '@/theme/theme-provider';
import { fontFamily, tabularNums } from '@/theme';

/** Pass rate / failed / flagged are a fixed 7-day snapshot in the source design, not derived from the live queue. */
export function QueueSummary() {
  const theme = useTheme();

  return (
    <Card elevation="inverted" style={styles.card}>
      <View style={styles.gap4}>
        <Text style={[styles.eyebrow, { color: theme.onDark.textMuted }]}>Pass rate · 7 days</Text>
        <Text style={[styles.value, tabularNums, { color: theme.onDark.text }]}>96.2%</Text>
      </View>
      <View style={styles.statsRow}>
        <View style={styles.statCell}>
          <Text style={[styles.statValue, tabularNums, { color: theme.onDark.dangerWashText }]}>2</Text>
          <Text style={[styles.statLabel, { color: theme.onDark.textMuted }]}>Failed</Text>
        </View>
        <View style={styles.statCell}>
          <Text style={[styles.statValue, tabularNums, { color: theme.onDark.warningWashText }]}>5</Text>
          <Text style={[styles.statLabel, { color: theme.onDark.textMuted }]}>Flagged</Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14 },
  gap4: { gap: 4 },
  eyebrow: { fontFamily: fontFamily.mono, fontSize: 10, letterSpacing: 0.12 * 10, textTransform: 'uppercase' },
  value: { fontFamily: fontFamily.semibold, fontSize: 26, letterSpacing: -0.02 * 26, lineHeight: 26 },
  statsRow: { flexDirection: 'row', gap: 16 },
  statCell: { alignItems: 'flex-end', gap: 3 },
  statValue: { fontSize: 17, fontWeight: '600', lineHeight: 17 },
  statLabel: { fontFamily: fontFamily.mono, fontSize: 9.5, letterSpacing: 0.1 * 9.5, textTransform: 'uppercase' },
});
