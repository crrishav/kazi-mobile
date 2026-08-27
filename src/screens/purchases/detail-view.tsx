import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DualDate } from '@/components/ui/dual-date';
import { Money } from '@/components/ui/money';
import { StatusPill, type StatusKind } from '@/components/ui/status-pill';
import { useTheme } from '@/theme/theme-provider';
import { fontFamily, tabularNums } from '@/theme';
import { STATUS } from '@/data/purchases/mock';
import type { PurchaseEntry, PurchaseStatus } from '@/data/purchases/types';

const PILL_KIND: Record<PurchaseStatus, StatusKind> = {
  paid: 'on-track',
  partial: 'at-risk',
  unpaid: 'blocked',
};

export interface DetailViewProps {
  entry: PurchaseEntry;
  canEdit: boolean;
  onEdit: () => void;
  onMarkPaid: () => void;
  onDelete: () => void;
}

export function DetailView({ entry, canEdit, onEdit, onMarkPaid, onDelete }: DetailViewProps) {
  const theme = useTheme();
  const status = STATUS[entry.status];

  const facts = [
    { label: 'Payment', value: entry.bankName ? `${entry.paymentType} · ${entry.bankName}` : entry.paymentType },
    { label: 'Category', value: entry.category },
    { label: 'VAT bill', value: entry.vatBill ? 'Yes · 13%' : 'No' },
    { label: 'GRN', value: entry.grn ?? '—' },
    { label: 'Logged by', value: entry.loggedBy },
    { label: 'Reference', value: entry.expenseId },
  ];

  return (
    <Animated.View entering={FadeInUp.duration(220)} style={styles.wrap}>
      <DualDate iso={entry.date} inline size={12} style={styles.dateLine} />

      <Card elevation="inverted" style={styles.amountCard}>
        <View style={styles.amountRow}>
          <View style={styles.gap5}>
            <Text style={[styles.eyebrow, { color: theme.onDark.textMuted }]}>Grand total</Text>
            <Money npr={entry.amountNPR} size={30} onDark primaryStyle={styles.amountValue} />
          </View>
          <StatusPill status={PILL_KIND[entry.status]} label={status.label} />
        </View>
        <View style={[styles.divider, { backgroundColor: 'rgba(233,241,236,0.14)' }]} />
        <View style={styles.statusLineRow}>
          <Text style={[styles.statusLine, { color: theme.onDark.avatarText }]}>
            {entry.party} · {entry.items.length} {entry.items.length === 1 ? 'line' : 'lines'}
          </Text>
          {canEdit && entry.status !== 'paid' ? <Button label="Mark paid" size="small" onPress={onMarkPaid} /> : null}
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
          {entry.items.map((l, i) => (
            <View key={i} style={[styles.lineRow, { borderTopColor: theme.background }]}>
              <View style={styles.lineTextWrap}>
                <Text style={[styles.lineName, { color: theme.textPrimary }]}>{l.particulars}</Text>
                <Text style={[styles.lineQty, tabularNums, { color: theme.textSecondary }]}>
                  {l.quantity.toLocaleString('en-IN')} {l.unit} @ रु {l.rate.toLocaleString('en-IN')}
                </Text>
              </View>
              <Text style={[styles.lineValue, tabularNums, { color: theme.textPrimary }]}>रु {l.amount.toLocaleString('en-IN')}</Text>
            </View>
          ))}

          <View style={[styles.totalsBlock, { borderTopColor: theme.border }]}>
            <TotalRow label="Subtotal" text={`रु ${entry.subtotalNPR.toLocaleString('en-IN')}`} theme={theme} />
            {entry.discountAmt > 0 ? <TotalRow label="Discount" text={`− रु ${entry.discountAmt.toLocaleString('en-IN')}`} theme={theme} /> : null}
            <TotalRow label="Taxable" text={`रु ${entry.taxableAmt.toLocaleString('en-IN')}`} theme={theme} />
            {entry.vatBill ? <TotalRow label="VAT · 13%" text={`रु ${entry.vatAmountNPR.toLocaleString('en-IN')}`} theme={theme} /> : null}
          </View>
          <View style={[styles.grandRow, { borderTopColor: theme.border }]}>
            <Text style={[styles.grandLabel, { color: theme.textSecondary }]}>Grand total</Text>
            <Money npr={entry.amountNPR} size={16} align="right" />
          </View>
        </View>
      </Card>

      {canEdit ? (
        <View style={styles.actions}>
          <Button label="Edit purchase" variant="secondary" onPress={onEdit} style={styles.flex1} />
          <Button label="Delete" variant="dangerOutline" onPress={onDelete} style={styles.flex1} />
        </View>
      ) : null}
    </Animated.View>
  );
}

function TotalRow({ label, text, theme }: { label: string; text: string; theme: ReturnType<typeof useTheme> }) {
  return (
    <View style={styles.totalRow}>
      <Text style={[styles.totalLabel, { color: theme.textSecondary }]}>{label}</Text>
      <Text style={[styles.totalValue, tabularNums, { color: theme.textPrimary }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  dateLine: { paddingHorizontal: 2 },
  amountCard: { padding: 18, gap: 14 },
  amountRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 14 },
  gap5: { gap: 5 },
  eyebrow: { fontFamily: fontFamily.mono, fontSize: 10, letterSpacing: 0.12 * 10, textTransform: 'uppercase' },
  amountValue: { fontFamily: fontFamily.semibold, fontSize: 30, letterSpacing: -0.03 * 30, lineHeight: 30 },
  divider: { height: 1 },
  statusLineRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  statusLine: { flex: 1, fontSize: 13, lineHeight: 13 * 1.4 },
  factsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  factCard: { width: '47%', flexGrow: 1, borderRadius: 16, padding: 13, gap: 5 },
  factLabel: { fontFamily: fontFamily.mono, fontSize: 9.5, letterSpacing: 0.11 * 9.5, textTransform: 'uppercase' },
  factValue: { fontSize: 14, fontWeight: '600' },
  section: { padding: 16, gap: 12 },
  sectionTitle: { fontFamily: fontFamily.semibold, fontSize: 15 },
  lineRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, paddingVertical: 10, borderTopWidth: 1 },
  lineTextWrap: { flex: 1, gap: 3, minWidth: 0 },
  lineName: { fontSize: 14, fontWeight: '600' },
  lineQty: { fontFamily: fontFamily.mono, fontSize: 10.5 },
  lineValue: { fontSize: 14, fontWeight: '600', flexShrink: 0 },
  totalsBlock: { borderTopWidth: 1.5, paddingTop: 10, marginTop: 4, gap: 7 },
  totalRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  totalLabel: { fontFamily: fontFamily.mono, fontSize: 10, letterSpacing: 0.08 * 10, textTransform: 'uppercase' },
  totalValue: { fontSize: 13, fontWeight: '600' },
  grandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, paddingTop: 10, marginTop: 6 },
  grandLabel: { fontFamily: fontFamily.mono, fontSize: 10.5, letterSpacing: 0.1 * 10.5, textTransform: 'uppercase' },
  actions: { flexDirection: 'row', gap: 10 },
  flex1: { flex: 1 },
});
