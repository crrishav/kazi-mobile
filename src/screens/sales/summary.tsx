import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Sparkline } from '@/components/ui/sparkline';
import { useTheme } from '@/theme/theme-provider';
import { fontFamily, tabularNums } from '@/theme';
import { STAGES } from '@/data/sales/mock';
import type { Order } from '@/data/sales/types';
import { lakh } from '@/data/sales/utils';

export interface SummaryProps {
  orders: Order[];
}

const NEW_SPARKLINE = [6, 9, 7, 14, 13, 19, 22];

export function Summary({ orders }: SummaryProps) {
  const theme = useTheme();
  const active = orders.filter((o) => o.stage !== 'delivered');
  const delivered = orders.filter((o) => o.stage === 'delivered');
  const deliveredCount = delivered.length + 9;
  const deliveredTarget = 14;
  const deliveredPct = Math.min(100, Math.round((deliveredCount / deliveredTarget) * 100));

  const mixBars = STAGES.map((s) => {
    const n = orders.filter((o) => o.stage === s.id).length;
    return { weight: Math.max(n, 0.12), color: n ? s.bar : theme.onDark.accentWash };
  });

  return (
    <View style={styles.wrap}>
      <Card elevation="inverted" style={styles.heroCard}>
        <View style={styles.heroRow}>
          <View style={styles.gap6}>
            <Text style={[styles.eyebrow, { color: theme.onDark.textMuted }]}>Active orders</Text>
            <View style={styles.baselineRow}>
              <Text style={[styles.heroValue, tabularNums, { color: theme.onDark.text }]}>{active.length}</Text>
              <Text style={[styles.heroUnit, { color: theme.onDark.textMuted }]}>{active.reduce((n, o) => n + o.qty, 0).toLocaleString()} pcs</Text>
            </View>
          </View>
          <View style={[styles.gap5, styles.alignEnd]}>
            <Text style={[styles.eyebrow, { color: theme.onDark.textMuted }]}>Order value</Text>
            <Text style={[styles.heroSubValue, tabularNums, { color: theme.onDark.text }]}>{lakh(active.reduce((n, o) => n + o.value, 0))}</Text>
          </View>
        </View>
        <View style={styles.mixTrack}>
          {mixBars.map((b, i) => (
            <View key={i} style={{ flex: b.weight, backgroundColor: b.color }} />
          ))}
        </View>
        <View style={styles.mixLabels}>
          <Text style={[styles.mixLabel, { color: theme.onDark.textMuted }]}>sourcing</Text>
          <Text style={[styles.mixLabel, { color: theme.onDark.textMuted }]}>delivered</Text>
        </View>
      </Card>

      <View style={styles.metricsRow}>
        <Card elevation="raised" style={styles.metricCard}>
          <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>New this week</Text>
          <View style={styles.baselineRow}>
            <Text style={[styles.metricValue, tabularNums, { color: theme.textPrimary }]}>3</Text>
            <Text style={[styles.metricDelta, { color: theme.accentWashText }]}>+2</Text>
          </View>
          <Sparkline values={NEW_SPARKLINE} width={130} height={26} color={theme.accent} />
          <Text style={[styles.metricFoot, tabularNums, { color: theme.textSecondary }]}>6,700 pcs booked</Text>
        </Card>
        <Card elevation="raised" style={styles.metricCard}>
          <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Delivered · Aug</Text>
          <View style={styles.baselineRow}>
            <Text style={[styles.metricValue, tabularNums, { color: theme.textPrimary }]}>{deliveredCount}</Text>
            <Text style={[styles.metricDeltaMuted, { color: theme.textSecondary }]}>of {deliveredTarget}</Text>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: theme.draftWash }]}>
            <View style={[styles.progressFill, { width: `${deliveredPct}%`, backgroundColor: theme.accent }]} />
          </View>
          <Text style={[styles.metricFoot, tabularNums, { color: theme.textSecondary }]}>10 of 11 on time</Text>
        </Card>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  heroCard: { padding: 17, gap: 13 },
  heroRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 14 },
  gap5: { gap: 5 },
  gap6: { gap: 6 },
  alignEnd: { alignItems: 'flex-end' },
  eyebrow: { fontFamily: fontFamily.mono, fontSize: 10, letterSpacing: 0.12 * 10, textTransform: 'uppercase' },
  baselineRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  heroValue: { fontFamily: fontFamily.semibold, fontSize: 34, letterSpacing: -0.03 * 34, lineHeight: 34 },
  heroUnit: { fontFamily: fontFamily.mono, fontSize: 11.5 },
  heroSubValue: { fontFamily: fontFamily.semibold, fontSize: 17, lineHeight: 17 },
  mixTrack: { flexDirection: 'row', gap: 2, height: 7, borderRadius: 99, overflow: 'hidden' },
  mixLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  mixLabel: { fontFamily: fontFamily.mono, fontSize: 9.5, letterSpacing: 0.08 * 9.5, textTransform: 'uppercase' },
  metricsRow: { flexDirection: 'row', gap: 10 },
  metricCard: { flex: 1, padding: 15, gap: 9 },
  metricLabel: { fontFamily: fontFamily.mono, fontSize: 9.5, letterSpacing: 0.11 * 9.5, textTransform: 'uppercase' },
  metricValue: { fontFamily: fontFamily.semibold, fontSize: 28, letterSpacing: -0.03 * 28, lineHeight: 28 },
  metricDelta: { fontSize: 12, fontWeight: '600' },
  metricDeltaMuted: { fontSize: 12, fontWeight: '600' },
  metricFoot: { fontFamily: fontFamily.mono, fontSize: 10 },
  progressTrack: { height: 6, borderRadius: 99, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 99 },
});
