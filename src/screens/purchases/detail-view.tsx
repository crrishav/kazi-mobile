import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { StatusPill, type StatusKind } from '@/components/ui/status-pill';
import { useTheme } from '@/theme/theme-provider';
import { fontFamily, tabularNums } from '@/theme';
import { DAY_LABEL, STATUS } from '@/data/purchases/mock';
import { money } from '@/data/purchases/utils';
import type { PurchaseEntry, PurchaseStatus } from '@/data/purchases/types';

const PILL_KIND: Record<PurchaseStatus, StatusKind> = {
  paid: 'on-track',
  partial: 'at-risk',
  unpaid: 'blocked',
};

export interface DetailViewProps {
  entry: PurchaseEntry;
  onMarkPaid: () => void;
}

export function DetailView({ entry, onMarkPaid }: DetailViewProps) {
  const theme = useTheme();
  const status = STATUS[entry.status];
  const dayLabel = DAY_LABEL[entry.date] ?? entry.date;
  const statusLine =
    entry.status === 'paid'
      ? `Settled in full · ${entry.method.toLowerCase()}`
      : entry.status === 'partial'
        ? `50% advance paid · balance due ${entry.due}`
        : `Outstanding · due ${entry.due}`;

  const facts = [
    { label: 'Method', value: entry.method },
    { label: 'Recorded by', value: 'Prakash T.' },
    { label: 'GRN', value: entry.grn },
    { label: 'Due', value: entry.due },
    { label: 'Quantity', value: entry.qty },
    { label: 'Reference', value: entry.ref },
  ];

  const trail = [
    { who: 'PT', what: 'Entry created', when: `${dayLabel} · 09:12`, bg: theme.accentWash, fg: theme.accentWashText },
    { who: 'BS', what: `Goods received against ${entry.grn}`, when: `${dayLabel} · 11:40`, bg: theme.draftWash, fg: theme.textSecondary },
    {
      who: 'AK',
      what: entry.status === 'paid' ? `Payment released · ${entry.method.toLowerCase()}` : 'Awaiting finance approval',
      when: entry.status === 'paid' ? 'Same day · 16:05' : 'Pending',
      bg: entry.status === 'paid' ? theme.accentWash : theme.dangerWash,
      fg: entry.status === 'paid' ? theme.accentWashText : theme.dangerWashText,
    },
  ];

  return (
    <Animated.View entering={FadeInUp.duration(220)} style={styles.wrap}>
      <Card elevation="inverted" style={styles.amountCard}>
        <View style={styles.amountRow}>
          <View style={styles.gap5}>
            <Text style={[styles.eyebrow, { color: theme.onDark.textMuted }]}>Amount</Text>
            <Text style={[styles.amountValue, tabularNums, { color: theme.onDark.text }]}>{money(entry.amount)}</Text>
          </View>
          <StatusPill status={PILL_KIND[entry.status]} label={status.label} />
        </View>
        <View style={[styles.divider, { backgroundColor: 'rgba(233,241,236,0.14)' }]} />
        <View style={styles.statusLineRow}>
          <Text style={[styles.statusLine, { color: theme.onDark.avatarText }]}>{statusLine}</Text>
          {entry.status !== 'paid' ? <Button label="Mark paid" size="small" onPress={onMarkPaid} /> : null}
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
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Line items</Text>
        <View>
          {entry.lines.map((l, i) => (
            <View key={i} style={[styles.lineRow, { borderTopColor: theme.background }]}>
              <View style={styles.lineTextWrap}>
                <Text style={[styles.lineName, { color: theme.textPrimary }]}>{l.name}</Text>
                <Text style={[styles.lineQty, tabularNums, { color: theme.textSecondary }]}>{l.qty}</Text>
              </View>
              <Text style={[styles.lineValue, tabularNums, { color: theme.textPrimary }]}>{l.value}</Text>
            </View>
          ))}
          <View style={[styles.totalRow, { borderTopColor: theme.border }]}>
            <Text style={[styles.totalLabel, { color: theme.textSecondary }]}>Total</Text>
            <Text style={[styles.totalValue, tabularNums, { color: theme.textPrimary }]}>{money(entry.amount)}</Text>
          </View>
        </View>
      </Card>

      <Card elevation="raised" style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Trail</Text>
        {trail.map((t, i) => (
          <View key={i} style={styles.trailRow}>
            <View style={[styles.trailAvatar, { backgroundColor: t.bg }]}>
              <Text style={[styles.trailWho, { color: t.fg }]}>{t.who}</Text>
            </View>
            <View style={styles.trailTextWrap}>
              <Text style={[styles.trailWhat, { color: theme.textPrimary }]}>{t.what}</Text>
              <Text style={[styles.trailWhen, tabularNums, { color: theme.textSecondary }]}>{t.when}</Text>
            </View>
          </View>
        ))}
      </Card>

      <Pressable style={[styles.billRow, { backgroundColor: theme.surface, boxShadow: theme.shadows.card }]}>
        <View style={[styles.billThumb, { borderColor: theme.border, backgroundColor: theme.draftWash }]} />
        <View style={styles.billTextWrap}>
          <Text style={[styles.billTitle, { color: theme.textPrimary }]}>Bill photo</Text>
          <Text style={[styles.billHint, tabularNums, { color: theme.textSecondary }]}>{entry.bill}</Text>
        </View>
        <Icon name="chevron-right" size={16} color={theme.textSecondary} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  amountCard: { padding: 18, gap: 14 },
  amountRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 14 },
  gap5: { gap: 5 },
  eyebrow: { fontFamily: fontFamily.mono, fontSize: 10, letterSpacing: 0.12 * 10, textTransform: 'uppercase' },
  amountValue: { fontFamily: fontFamily.semibold, fontSize: 32, letterSpacing: -0.03 * 32, lineHeight: 32 },
  divider: { height: 1 },
  statusLineRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  statusLine: { flex: 1, fontSize: 13, lineHeight: 13 * 1.4 },
  factsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  factCard: { width: '47%', flexGrow: 1, borderRadius: 16, padding: 13, gap: 5 },
  factLabel: { fontFamily: fontFamily.mono, fontSize: 9.5, letterSpacing: 0.11 * 9.5, textTransform: 'uppercase' },
  factValue: { fontSize: 14.5, fontWeight: '600' },
  section: { padding: 16, gap: 12 },
  sectionTitle: { fontFamily: fontFamily.semibold, fontSize: 15 },
  lineRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, paddingVertical: 10, borderTopWidth: 1 },
  lineTextWrap: { flex: 1, gap: 3, minWidth: 0 },
  lineName: { fontSize: 14, fontWeight: '600' },
  lineQty: { fontFamily: fontFamily.mono, fontSize: 10.5 },
  lineValue: { fontSize: 14, fontWeight: '600', flexShrink: 0 },
  totalRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, paddingTop: 12, marginTop: 4, borderTopWidth: 1.5 },
  totalLabel: { fontFamily: fontFamily.mono, fontSize: 10.5, letterSpacing: 0.1 * 10.5, textTransform: 'uppercase' },
  totalValue: { fontSize: 16, fontWeight: '600' },
  trailRow: { flexDirection: 'row', gap: 11 },
  trailAvatar: { width: 30, height: 30, borderRadius: 11, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  trailWho: { fontSize: 11, fontWeight: '600' },
  trailTextWrap: { flex: 1, gap: 3, minWidth: 0 },
  trailWhat: { fontSize: 13.5, fontWeight: '600' },
  trailWhen: { fontFamily: fontFamily.mono, fontSize: 10.5 },
  billRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 20, padding: 16 },
  billThumb: { width: 44, height: 54, borderRadius: 11, borderWidth: 1, flexShrink: 0 },
  billTextWrap: { flex: 1, gap: 3, minWidth: 0 },
  billTitle: { fontSize: 13.5, fontWeight: '600' },
  billHint: { fontFamily: fontFamily.mono, fontSize: 10.5 },
});
