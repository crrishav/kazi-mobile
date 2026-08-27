import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { useTheme } from '@/theme/theme-provider';
import { fontFamily, tabularNums } from '@/theme';

export interface QueueSummaryProps {
  /** Rolled up from `qc_logs` (item 24). */
  passRate: string;
  failed: number;
  flagged: number;
  windowLabel: string;
}

/** Pass rate / failed / flagged, rolled up from the persisted QC logs. */
export function QueueSummary({ passRate, failed, flagged, windowLabel }: QueueSummaryProps) {
  const theme = useTheme();

  return (
    <Card elevation="inverted" style={styles.card}>
      <View style={styles.gap4}>
        <Text style={[styles.eyebrow, { color: theme.onDark.textMuted }]}>Pass rate · {windowLabel}</Text>
        <Text style={[styles.value, tabularNums, { color: theme.onDark.text }]}>{passRate}</Text>
      </View>
      <View style={styles.statsRow}>
        <View style={styles.statCell}>
          <Text style={[styles.statValue, tabularNums, { color: theme.onDark.dangerWashText }]}>{failed}</Text>
          <Text style={[styles.statLabel, { color: theme.onDark.textMuted }]}>Failed</Text>
        </View>
        <View style={styles.statCell}>
          <Text style={[styles.statValue, tabularNums, { color: theme.onDark.warningWashText }]}>{flagged}</Text>
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
