import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { useTheme } from '@/theme/theme-provider';
import { fontFamily, tabularNums } from '@/theme';
import { STAGES, STAGE_NOTE } from '@/data/sales/mock';
import type { Order } from '@/data/sales/types';
import { lakh } from '@/data/sales/utils';

export interface DetailViewProps {
  order: Order;
  onAdvance: () => void;
}

export function DetailView({ order, onAdvance }: DetailViewProps) {
  const theme = useTheme();
  const stageIndex = STAGES.findIndex((s) => s.id === order.stage);
  const stage = STAGES[stageIndex];
  const next = stageIndex < STAGES.length - 1 ? STAGES[stageIndex + 1] : null;
  const maxSize = Math.max(...order.sizes.map(([, count]) => count));

  const shipLine =
    order.stage === 'delivered'
      ? `Delivered ${order.ship} · ${Math.abs(order.shipDays)} days ago`
      : order.shipDays <= 4
        ? `Ships ${order.ship} · only ${order.shipDays} days left`
        : `Ships ${order.ship} · ${order.shipDays} days of float`;

  const facts = [
    { label: 'Customer PO', value: order.po },
    { label: 'Channel', value: order.channel },
    { label: 'Destination', value: order.city },
    { label: 'Payment terms', value: order.terms },
    { label: 'Product', value: order.product },
    { label: 'Ship date', value: order.ship },
  ];

  return (
    <Animated.View entering={FadeInUp.duration(220)} style={styles.wrap}>
      <Card elevation="inverted" style={styles.valueCard}>
        <View style={styles.valueRow}>
          <View style={styles.gap5}>
            <Text style={[styles.eyebrow, { color: theme.onDark.textMuted }]}>Order value</Text>
            <Text style={[styles.valueText, tabularNums, { color: theme.onDark.text }]}>{lakh(order.value)}</Text>
          </View>
          <View style={[styles.pill, { backgroundColor: stage.bg }]}>
            <View style={[styles.pillDot, { backgroundColor: stage.dot }]} />
            <Text style={[styles.pillLabel, { color: stage.fg }]}>{stage.label}</Text>
          </View>
        </View>
        <View style={[styles.divider, { backgroundColor: 'rgba(233,241,236,0.14)' }]} />
        <View style={styles.shipRow}>
          <Text style={[styles.shipLine, { color: theme.onDark.avatarText }]}>{shipLine}</Text>
          {next ? <Button label={`Move to ${next.short}`} size="small" onPress={onAdvance} /> : null}
        </View>
      </Card>

      <Card elevation="raised" style={styles.pipelineCard}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary, paddingBottom: 10 }]}>Pipeline</Text>
        {STAGES.map((s, i) => {
          const done = i < stageIndex;
          const current = i === stageIndex;
          return (
            <View key={s.id} style={styles.stageRow}>
              <View style={styles.markCol}>
                <View
                  style={[
                    styles.mark,
                    { backgroundColor: done ? theme.accent : theme.surface, borderColor: done ? theme.accent : current ? theme.accentDeep : theme.border },
                  ]}
                >
                  {done ? <Icon name="check" size={12} color={theme.accentText} /> : null}
                </View>
                {i < STAGES.length - 1 ? <View style={[styles.line, { backgroundColor: done ? theme.accent : theme.draftWash }]} /> : null}
              </View>
              <View style={styles.stageTextWrap}>
                <View style={styles.stageHeadRow}>
                  <Text style={[styles.stageLabel, { color: current ? theme.textPrimary : done ? theme.textPrimary : theme.textSecondary, fontFamily: current ? fontFamily.semibold : fontFamily.medium }]}>
                    {s.label}
                  </Text>
                  <Text style={[styles.stageWhen, tabularNums, { color: theme.textSecondary }]}>{done ? 'done' : current ? 'now' : '—'}</Text>
                </View>
                <Text style={[styles.stageNote, { color: theme.textSecondary }]}>
                  {current ? `${STAGE_NOTE[s.id]} · in progress` : done ? STAGE_NOTE[s.id] : 'Not started'}
                </Text>
              </View>
            </View>
          );
        })}
      </Card>

      <View style={styles.factsGrid}>
        {facts.map((f) => (
          <View key={f.label} style={[styles.factCard, { backgroundColor: theme.surface }]}>
            <Text style={[styles.factLabel, { color: theme.textSecondary }]}>{f.label}</Text>
            <Text style={[styles.factValue, tabularNums, { color: theme.textPrimary }]}>{f.value}</Text>
          </View>
        ))}
      </View>

      <Card elevation="raised" style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Size breakdown</Text>
        {order.sizes.map(([size, count]) => (
          <View key={size} style={styles.sizeRow}>
            <Text style={[styles.sizeLabel, { color: theme.textPrimary }]}>{size}</Text>
            <View style={[styles.sizeTrack, { backgroundColor: theme.draftWash }]}>
              <View style={[styles.sizeFill, { width: `${Math.round((count / maxSize) * 100)}%`, backgroundColor: theme.accentWash }]} />
            </View>
            <Text style={[styles.sizeCount, tabularNums, { color: theme.textPrimary }]}>{count.toLocaleString()}</Text>
          </View>
        ))}
      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  valueCard: { padding: 18, gap: 14 },
  valueRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 14 },
  gap5: { gap: 5 },
  eyebrow: { fontFamily: fontFamily.mono, fontSize: 10, letterSpacing: 0.12 * 10, textTransform: 'uppercase' },
  valueText: { fontFamily: fontFamily.semibold, fontSize: 30, letterSpacing: -0.03 * 30, lineHeight: 30 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 28, paddingHorizontal: 11, borderRadius: 999 },
  pillDot: { width: 6, height: 6, borderRadius: 99 },
  pillLabel: { fontSize: 12.5, fontWeight: '600' },
  divider: { height: 1 },
  shipRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  shipLine: { flex: 1, fontSize: 13, lineHeight: 13 * 1.4 },
  pipelineCard: { padding: 16 },
  sectionTitle: { fontFamily: fontFamily.semibold, fontSize: 15 },
  stageRow: { flexDirection: 'row', gap: 12 },
  markCol: { width: 22, alignItems: 'center' },
  mark: { width: 22, height: 22, borderRadius: 99, borderWidth: 2, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  line: { flex: 1, width: 2, minHeight: 20 },
  stageTextWrap: { flex: 1, gap: 3, paddingBottom: 16, minWidth: 0 },
  stageHeadRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 },
  stageLabel: { fontSize: 14.5, lineHeight: 14.5 * 1.25 },
  stageWhen: { fontFamily: fontFamily.mono, fontSize: 10.5, flexShrink: 0 },
  stageNote: { fontSize: 12.5, lineHeight: 12.5 * 1.45 },
  factsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  factCard: { width: '47%', flexGrow: 1, borderRadius: 16, padding: 13, gap: 5 },
  factLabel: { fontFamily: fontFamily.mono, fontSize: 9.5, letterSpacing: 0.11 * 9.5, textTransform: 'uppercase' },
  factValue: { fontSize: 14.5, fontWeight: '600' },
  section: { padding: 16, gap: 12 },
  sizeRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  sizeLabel: { width: 34, fontFamily: fontFamily.mono, fontSize: 11, letterSpacing: 0.08 * 11, textTransform: 'uppercase', flexShrink: 0 },
  sizeTrack: { flex: 1, height: 8, borderRadius: 99, overflow: 'hidden' },
  sizeFill: { height: '100%', borderRadius: 99 },
  sizeCount: { width: 52, textAlign: 'right', fontSize: 13, fontWeight: '600', flexShrink: 0 },
});
