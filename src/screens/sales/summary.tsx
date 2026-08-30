import { StyleSheet, View } from 'react-native';

import { KpiCard } from '@/components/ui/kpi-card';
import type { Order } from '@/data/sales/types';
import { lakh } from '@/data/sales/utils';

export interface SummaryProps {
  orders: Order[];
}

/** Current calendar month, short label — used for the "delivered this month" KPI. */
const THIS_MONTH = new Date().toLocaleDateString('en-US', { month: 'short' });

/** Read-only KPI row for the Sales overview: pipeline value, active vs completed, delivered this month. */
export function Summary({ orders }: SummaryProps) {
  const active = orders.filter((o) => o.stage !== 'delivered');
  const delivered = orders.filter((o) => o.stage === 'delivered');

  const pipelineValue = active.reduce((n, o) => n + o.value, 0);
  const activePcs = active.reduce((n, o) => n + o.qty, 0);
  const stagesWithWork = new Set(active.map((o) => o.stage)).size;
  const deliveredThisMonth = delivered.filter((o) => o.ship.includes(THIS_MONTH)).length;

  return (
    <View style={styles.grid}>
      <View style={styles.cell}>
        <KpiCard
          label="Pipeline value"
          value={lakh(pipelineValue)}
          context={`${activePcs.toLocaleString()} pcs in production`}
          inverted
        />
      </View>
      <View style={styles.cell}>
        <KpiCard
          label="Active orders"
          value={String(active.length)}
          context={`across ${stagesWithWork} ${stagesWithWork === 1 ? 'stage' : 'stages'}`}
        />
      </View>
      <View style={styles.cell}>
        <KpiCard label="Completed" value={String(delivered.length)} context="delivered to date" />
      </View>
      <View style={styles.cell}>
        <KpiCard
          label={`Delivered · ${THIS_MONTH}`}
          value={String(deliveredThisMonth)}
          context="this month"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  cell: { width: '47%', flexGrow: 1 },
});
