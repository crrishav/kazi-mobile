import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { useTheme } from '@/theme/theme-provider';
import { fontFamily, radii, tabularNums } from '@/theme';

export interface LedgerRowView {
  memo: string;
  meta: string;
  debit: string;
  credit: string;
}

export interface LedgerViewProps {
  closingBalance: string;
  movement: string;
  movementPositive: boolean;
  openingBalance: string;
  rows: LedgerRowView[];
  onPostJournal: () => void;
  onPostBank: () => void;
}

const COL_WIDTH = 74;
const AMOUNT_SPAN = COL_WIDTH * 2 + 8;

export function LedgerView({ closingBalance, movement, movementPositive, openingBalance, rows, onPostJournal, onPostBank }: LedgerViewProps) {
  const theme = useTheme();
  const moveColor = movementPositive ? theme.onDark.accentWashText : theme.onDark.dangerWashText;

  return (
    <View style={styles.wrap}>
      <Card elevation="inverted" style={styles.balanceCard}>
        <View style={styles.gap5}>
          <Text style={[styles.eyebrow, { color: theme.onDark.textMuted }]}>Closing balance</Text>
          <Text style={[styles.closingValue, tabularNums, { color: theme.onDark.text }]}>{closingBalance}</Text>
        </View>
        <View style={styles.movementWrap}>
          <Text style={[styles.eyebrow, { color: theme.onDark.textMuted }]}>Movement</Text>
          <Text style={[styles.movementValue, tabularNums, { color: moveColor }]}>{movement}</Text>
        </View>
      </Card>

      <View style={[styles.tableCard, { backgroundColor: theme.surface, boxShadow: theme.shadows.card }]}>
        <View style={[styles.tableHeader, { backgroundColor: theme.surfaceRaised, borderBottomColor: theme.background }]}>
          <Text style={[styles.headDetail, { color: theme.textSecondary }]}>Detail</Text>
          <Text style={[styles.headCol, { width: COL_WIDTH, color: theme.textSecondary }]}>Debit</Text>
          <Text style={[styles.headCol, { width: COL_WIDTH, color: theme.textSecondary }]}>Credit</Text>
        </View>

        <View style={[styles.openingRow, { backgroundColor: theme.surfaceRaised, borderBottomColor: theme.background }]}>
          <Text style={[styles.openingLabel, { color: theme.textSecondary }]}>Opening balance · 01 Shrawan</Text>
          <Text style={[styles.openingValue, tabularNums, { width: AMOUNT_SPAN, color: theme.textPrimary }]}>{openingBalance}</Text>
        </View>

        {rows.map((r, i) => (
          <View key={i} style={[styles.ledgerRow, { borderTopColor: theme.border }]}>
            <View style={styles.ledgerTextWrap}>
              <Text style={[styles.ledgerMemo, { color: theme.textPrimary }]} numberOfLines={1}>
                {r.memo}
              </Text>
              <Text style={[styles.ledgerMeta, tabularNums, { color: theme.textSecondary }]} numberOfLines={1}>
                {r.meta}
              </Text>
            </View>
            <Text style={[styles.ledgerAmount, tabularNums, { width: COL_WIDTH, color: theme.textPrimary }]}>{r.debit}</Text>
            <Text style={[styles.ledgerAmount, tabularNums, { width: COL_WIDTH, color: theme.textPrimary }]}>{r.credit}</Text>
          </View>
        ))}

        <View style={[styles.closingRow, { backgroundColor: theme.surfaceRaised, borderTopColor: theme.border }]}>
          <Text style={[styles.closingLabel, { color: theme.textPrimary }]}>Closing balance</Text>
          <Text style={[styles.closingRowValue, tabularNums, { width: AMOUNT_SPAN, color: theme.textPrimary }]}>{closingBalance}</Text>
        </View>
      </View>

      <View style={styles.buttonRow}>
        <Pressable onPress={onPostJournal} style={[styles.actionButton, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.actionLabel, { color: theme.textPrimary }]}>Post journal</Text>
        </Pressable>
        <Pressable onPress={onPostBank} style={[styles.actionButton, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.actionLabel, { color: theme.textPrimary }]}>Bank entry</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  balanceCard: { padding: 15, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 14 },
  gap5: { gap: 5 },
  eyebrow: { fontFamily: fontFamily.mono, fontSize: 10, letterSpacing: 0.12 * 10, textTransform: 'uppercase' },
  closingValue: { fontSize: 28, fontWeight: '600', letterSpacing: -0.03 * 28, lineHeight: 28 },
  movementWrap: { alignItems: 'flex-end', gap: 5 },
  movementValue: { fontSize: 15, fontWeight: '600', lineHeight: 15 },

  tableCard: { borderRadius: radii.lg, overflow: 'hidden' },
  tableHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 11, paddingHorizontal: 15, borderBottomWidth: StyleSheet.hairlineWidth },
  headDetail: { flex: 1, fontFamily: fontFamily.mono, fontSize: 9.5, letterSpacing: 0.1 * 9.5, textTransform: 'uppercase' },
  headCol: { textAlign: 'right', fontFamily: fontFamily.mono, fontSize: 9.5, letterSpacing: 0.1 * 9.5, textTransform: 'uppercase' },

  openingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 11, paddingHorizontal: 15, borderBottomWidth: StyleSheet.hairlineWidth },
  openingLabel: { flex: 1, fontSize: 12.5 },
  openingValue: { textAlign: 'right', fontSize: 12 },

  ledgerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingVertical: 12, paddingHorizontal: 15, borderTopWidth: StyleSheet.hairlineWidth },
  ledgerTextWrap: { flex: 1, gap: 3, minWidth: 0 },
  ledgerMemo: { fontFamily: fontFamily.semibold, fontSize: 13.5 },
  ledgerMeta: { fontSize: 10 },
  ledgerAmount: { textAlign: 'right', fontSize: 12 },

  closingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 13, paddingHorizontal: 15, borderTopWidth: 1.5 },
  closingLabel: { flex: 1, fontFamily: fontFamily.semibold, fontSize: 13 },
  closingRowValue: { textAlign: 'right', fontFamily: fontFamily.mono, fontSize: 13, fontWeight: '500' },

  buttonRow: { flexDirection: 'row', gap: 8 },
  actionButton: { flex: 1, height: 48, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontFamily: fontFamily.semibold, fontSize: 14 },
});
