import { StyleSheet, View } from 'react-native';

import { KpiCard } from '@/components/ui/kpi-card';
import type { KpiDatum } from '@/data/dashboard/types';

export interface KpiGridProps {
  kpis: KpiDatum[];
  approvalsCount: number;
}

/** Four KPIs, no more — the fourth ("Your approvals") is always the one inverted card, driven by the live approvals count. */
export function KpiGrid({ kpis, approvalsCount }: KpiGridProps) {
  return (
    <View style={styles.grid}>
      {kpis.map((kpi) => (
        <View key={kpi.id} style={styles.cell}>
          <KpiCard label={kpi.label} value={kpi.value} delta={kpi.delta} context={kpi.context} sparkline={kpi.sparkline} />
        </View>
      ))}
      <View style={styles.cell}>
        <KpiCard
          label="Your approvals"
          value={String(approvalsCount)}
          delta={{ tone: approvalsCount > 0 ? 'good' : 'neutral', text: approvalsCount > 0 ? 'Oldest 2h' : 'All clear' }}
          sparkline={[14, 11, 13, 9, 10, 6, 8, 5]}
          inverted
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  cell: {
    width: '47%',
    flexGrow: 1,
  },
});
