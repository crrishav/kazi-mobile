import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { ThresholdBar } from '@/components/ui/threshold-bar';
import { useTheme } from '@/theme/theme-provider';
import { fontFamily, tabularNums } from '@/theme';
import { stockHistory, stockMovements } from '@/data/inventory/mock';
import { stockLevel, stockRatio } from '@/data/inventory/utils';
import type { StockItem } from '@/data/inventory/types';

export interface DetailViewProps {
  item: StockItem;
  onBack: () => void;
  onRaisePO: () => void;
}

export function DetailView({ item, onBack, onRaisePO }: DetailViewProps) {
  const theme = useTheme();
  const level = stockLevel(item);
  const barColor = level === 'low' ? theme.accent : level === 'near' ? theme.accent : theme.accent;
  const statusLine =
    level === 'low'
      ? `Short by ${(item.threshold - item.qty).toLocaleString()} ${item.unit} · lead time ${item.lead}`
      : level === 'near'
        ? `Within 15% of the reorder line · lead ${item.lead}`
        : `Healthy · ${Math.round((item.qty / item.threshold) * 100)}% of reorder point`;

  const facts = [
    { label: 'Supplier', value: item.supplier },
    { label: 'Lead time', value: item.lead },
    { label: 'Location', value: item.location },
    { label: 'Last cost', value: item.cost },
  ];

  const maxHistory = Math.max(...stockHistory);

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Pressable onPress={onBack} style={[styles.backButton, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Icon name="chevron-left" size={18} color={theme.textPrimary} />
        </Pressable>
        <View style={styles.headerTextWrap}>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[styles.headerMeta, { color: theme.textSecondary }]} numberOfLines={1}>
            {item.sku} · {item.supplier}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Card elevation="inverted" style={styles.onHandCard}>
          <View style={styles.onHandRow}>
            <View style={styles.gap5}>
              <Text style={[styles.eyebrow, { color: theme.onDark.textMuted }]}>On hand</Text>
              <View style={styles.baselineRow}>
                <Text style={[styles.onHandValue, tabularNums, { color: theme.onDark.text }]}>{item.qty.toLocaleString()}</Text>
                <Text style={[styles.onHandUnit, { color: theme.onDark.textMuted }]}>{item.unit}</Text>
              </View>
            </View>
            <View style={[styles.gap5, styles.alignEnd]}>
              <Text style={[styles.eyebrow, { color: theme.onDark.textMuted }]}>Reorder at</Text>
              <Text style={[styles.reorderValue, tabularNums, { color: theme.onDark.text }]}>{item.threshold.toLocaleString()}</Text>
            </View>
          </View>
          <ThresholdBar
            ratio={Math.min(stockRatio(item), 1)}
            markRatio={0.5}
            color={barColor}
            trackColor="rgba(233,241,236,0.16)"
            tickColor={theme.onDark.text}
            height={6}
          />
          <View style={styles.statusRow}>
            <Text style={[styles.statusLine, { color: theme.onDark.avatarText }]}>{statusLine}</Text>
            <Button label="Raise PO" size="small" onPress={onRaisePO} />
          </View>
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
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Stock history</Text>
            <Text style={[styles.sectionMeta, tabularNums, { color: theme.textSecondary }]}>30 days</Text>
          </View>
          <View style={styles.historyChart}>
            {stockHistory.map((h, i) => (
              <View key={i} style={styles.historyBarWrap}>
                <View
                  style={[
                    styles.historyBar,
                    {
                      height: `${(h / maxHistory) * 100}%`,
                      backgroundColor: h < 50 ? '#E3B49E' : h < 60 ? '#E6D3A6' : '#BFE4D2',
                    },
                  ]}
                />
              </View>
            ))}
          </View>
          <View style={styles.historyLabels}>
            <Text style={[styles.historyLabel, { color: theme.textSecondary }]}>26 Jul</Text>
            <Text style={[styles.historyLabel, { color: theme.textSecondary }]}>reorder line</Text>
            <Text style={[styles.historyLabel, { color: theme.textSecondary }]}>23 Aug</Text>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.background }]} />

          <View>
            {stockMovements.map((m, i) => (
              <View key={i} style={[styles.movementRow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.border }]}>
                <View
                  style={[
                    styles.movementIcon,
                    { backgroundColor: m.tone === 'in' ? theme.accentWash : theme.draftWash },
                  ]}
                >
                  <Text style={[styles.movementSign, { color: m.tone === 'in' ? theme.accentWashText : theme.textSecondary }]}>{m.sign}</Text>
                </View>
                <View style={styles.movementTextWrap}>
                  <View style={styles.movementLine}>
                    <Text style={[styles.movementTitle, { color: theme.textPrimary }]}>{m.title}</Text>
                    <Text style={[styles.movementAmount, tabularNums, { color: m.tone === 'in' ? theme.accentWashText : theme.textPrimary }]}>
                      {m.amount}
                    </Text>
                  </View>
                  <View style={styles.movementLine}>
                    <Text style={[styles.movementRef, { color: theme.textSecondary }]} numberOfLines={1}>
                      {m.ref}
                    </Text>
                    <Text style={[styles.movementBalance, tabularNums, { color: theme.textSecondary }]}>bal {m.balance}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </Card>

        <Card elevation="raised" style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Linked library</Text>
          <View style={styles.gap12}>
            <View style={styles.linkRow}>
              <View style={[styles.linkThumb, { borderColor: theme.border }]} />
              <View style={styles.gap2}>
                <Text style={[styles.linkName, { color: theme.textPrimary }]}>Anti-Grunge Cotton datasheet</Text>
                <Text style={[styles.linkMeta, { color: theme.textSecondary }]}>PDF · supplier doc</Text>
              </View>
            </View>
            <View style={styles.linkRow}>
              <View style={[styles.linkThumb, { borderColor: theme.border }]} />
              <View style={styles.gap2}>
                <Text style={[styles.linkName, { color: theme.textPrimary }]}>Lab dip · Ink green 04</Text>
                <Text style={[styles.linkMeta, { color: theme.textSecondary }]}>IMG · approved 09 Aug</Text>
              </View>
            </View>
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextWrap: { flex: 1, gap: 2, minWidth: 0 },
  headerTitle: { fontFamily: fontFamily.semibold, fontSize: 18, letterSpacing: -0.02 * 18 },
  headerMeta: { fontFamily: fontFamily.mono, fontSize: 10, letterSpacing: 0.1 * 10, textTransform: 'uppercase' },
  content: { padding: 16, paddingBottom: 32, gap: 12 },
  onHandCard: { padding: 17, gap: 14 },
  onHandRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 14 },
  gap5: { gap: 5 },
  gap2: { gap: 2 },
  gap12: { gap: 12 },
  alignEnd: { alignItems: 'flex-end' },
  eyebrow: { fontFamily: fontFamily.mono, fontSize: 10, letterSpacing: 0.12 * 10, textTransform: 'uppercase' },
  baselineRow: { flexDirection: 'row', alignItems: 'baseline', gap: 7 },
  onHandValue: { fontFamily: fontFamily.semibold, fontSize: 32, letterSpacing: -0.03 * 32 },
  onHandUnit: { fontFamily: fontFamily.mono, fontSize: 12 },
  reorderValue: { fontFamily: fontFamily.semibold, fontSize: 17 },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  statusLine: { flex: 1, fontSize: 13, lineHeight: 13 * 1.4 },
  factsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  factCard: { width: '47%', flexGrow: 1, borderRadius: 16, padding: 13, gap: 5 },
  factLabel: { fontFamily: fontFamily.mono, fontSize: 9.5, letterSpacing: 0.11 * 9.5, textTransform: 'uppercase' },
  factValue: { fontSize: 14.5, fontWeight: '600' },
  section: { padding: 16, gap: 14 },
  sectionHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  sectionTitle: { fontFamily: fontFamily.semibold, fontSize: 15 },
  sectionMeta: { fontFamily: fontFamily.mono, fontSize: 11 },
  historyChart: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 76 },
  historyBarWrap: { flex: 1, justifyContent: 'flex-end', height: '100%' },
  historyBar: { borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  historyLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  historyLabel: { fontFamily: fontFamily.mono, fontSize: 9.5, letterSpacing: 0.08 * 9.5, textTransform: 'uppercase' },
  divider: { height: 1 },
  movementRow: { flexDirection: 'row', gap: 12, paddingVertical: 11 },
  movementIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  movementSign: { fontFamily: fontFamily.mono, fontSize: 15, fontWeight: '600' },
  movementTextWrap: { flex: 1, gap: 3, minWidth: 0 },
  movementLine: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 },
  movementTitle: { fontSize: 14, fontWeight: '600' },
  movementAmount: { fontSize: 14, fontWeight: '600', flexShrink: 0 },
  movementRef: { flex: 1, fontFamily: fontFamily.mono, fontSize: 10.5 },
  movementBalance: { fontFamily: fontFamily.mono, fontSize: 10.5, flexShrink: 0 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  linkThumb: { width: 38, height: 46, borderRadius: 10, borderWidth: 1, flexShrink: 0 },
  linkName: { fontSize: 13.5, fontWeight: '600' },
  linkMeta: { fontFamily: fontFamily.mono, fontSize: 10.5 },
});
