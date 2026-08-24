import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { useTheme } from '@/theme/theme-provider';
import { fontFamily, radii, tabularNums } from '@/theme';
import { signed } from '@/data/accounting/utils';
import type { ChartRowModel } from '@/data/accounting/utils';

export interface ExpenseRowModel {
  id: string;
  code: string;
  label: string;
  amount: number;
}

export interface SheetViewProps {
  totalAssets: string;
  totalClaims: string;
  balanced: boolean;
  checkDiff: string;
  rows: ChartRowModel[];
  onToggleGroup: (id: string) => void;
  onOpenLedger: (id: string) => void;
  expensesOpen: boolean;
  onToggleExpenses: () => void;
  expenseTotal: string;
  expenseRows: ExpenseRowModel[];
}

export function SheetView({
  totalAssets,
  totalClaims,
  balanced,
  checkDiff,
  rows,
  onToggleGroup,
  onOpenLedger,
  expensesOpen,
  onToggleExpenses,
  expenseTotal,
  expenseRows,
}: SheetViewProps) {
  const theme = useTheme();
  const checkBg = balanced ? theme.onDark.accentWash : theme.onDark.dangerWash;
  const checkFg = balanced ? theme.onDark.accentWashText : theme.onDark.dangerWashText;

  return (
    <View style={styles.wrap}>
      <Card elevation="inverted" style={styles.checkCard}>
        <View style={styles.checkRow}>
          <Text style={[styles.checkLabel, { color: theme.onDark.textMuted }]}>Total assets</Text>
          <Text style={[styles.checkValue, tabularNums, { color: theme.onDark.text }]}>{totalAssets}</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: 'rgba(233,241,236,0.14)' }]} />
        <View style={styles.checkRow}>
          <Text style={[styles.checkLabel, { color: theme.onDark.textMuted }]}>Liabilities + equity</Text>
          <Text style={[styles.checkValue, tabularNums, { color: theme.onDark.text }]}>{totalClaims}</Text>
        </View>
        <View style={[styles.balancePill, { backgroundColor: checkBg }]}>
          <Icon name="check" size={15} color={checkFg} />
          <Text style={[styles.balanceLabel, { color: checkFg }]}>{balanced ? 'Sheet balances' : 'Out of balance'}</Text>
          <Text style={[styles.balanceDiff, tabularNums, { color: checkFg }]}>{checkDiff}</Text>
        </View>
      </Card>

      <View style={[styles.tableCard, { backgroundColor: theme.surface, boxShadow: theme.shadows.card }]}>
        <View style={[styles.tableHeader, { backgroundColor: theme.surfaceRaised, borderBottomColor: theme.background }]}>
          <Text style={[styles.tableHeadCode, { color: theme.textSecondary }]}>Code</Text>
          <Text style={[styles.tableHeadLabel, { color: theme.textSecondary }]}>Account</Text>
          <Text style={[styles.tableHeadAmount, { color: theme.textSecondary }]}>Balance · NPR</Text>
        </View>
        {rows.map((r, i) => (
          <Pressable
            key={r.id}
            onPress={() => (r.kind === 'group' ? onToggleGroup(r.id) : onOpenLedger(r.id))}
            style={[
              styles.chartRow,
              {
                paddingLeft: r.kind === 'group' ? (r.depth === 0 ? 15 : 27) : 15,
                paddingVertical: r.kind === 'group' ? (r.isTop ? 13 : 11) : 10,
                backgroundColor: r.isTop ? theme.surfaceRaised : theme.surface,
                borderTopWidth: i === 0 ? 0 : StyleSheet.hairlineWidth,
                borderTopColor: theme.border,
              },
            ]}
          >
            {r.kind === 'group' ? (
              <View style={r.open ? styles.chevronOpen : undefined}>
                <Icon name="chevron-right" size={14} color={theme.textPrimary} />
              </View>
            ) : (
              <Text style={[styles.leafCode, tabularNums, { color: theme.textSecondary }]}>{r.code}</Text>
            )}
            <Text
              style={[
                r.isTop ? styles.groupTopLabel : r.kind === 'group' ? styles.groupLabel : styles.leafLabel,
                { color: theme.textPrimary },
              ]}
              numberOfLines={1}
            >
              {r.label}
            </Text>
            <Text
              style={[
                r.kind === 'group' ? (r.isTop ? styles.groupTopAmount : styles.groupAmount) : styles.leafAmount,
                r.kind === 'leaf' ? tabularNums : null,
                { color: r.amount < 0 ? theme.dangerText : theme.textPrimary },
              ]}
            >
              {signed(r.amount)}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={[styles.tableCard, { backgroundColor: theme.surface, boxShadow: theme.shadows.card }]}>
        <Pressable onPress={onToggleExpenses} style={[styles.expenseHeader, { backgroundColor: theme.surfaceRaised }]}>
          <View style={expensesOpen ? styles.chevronOpen : undefined}>
            <Icon name="chevron-right" size={14} color={theme.textPrimary} />
          </View>
          <View style={styles.expenseHeaderText}>
            <Text style={[styles.expenseTitle, { color: theme.textPrimary }]}>Expense accounts</Text>
            <Text style={[styles.expenseSub, { color: theme.textSecondary }]}>Profit &amp; loss · year to date</Text>
          </View>
          <Text style={[styles.expenseTotal, tabularNums, { color: theme.textPrimary }]}>{expenseTotal}</Text>
        </Pressable>
        {expensesOpen
          ? expenseRows.map((x, i) => (
              <Animated.View key={x.id} entering={FadeInUp.delay(Math.min(i, 6) * 30).duration(220)}>
                <Pressable
                  onPress={() => onOpenLedger(x.id)}
                  style={[styles.expenseRow, { borderTopColor: theme.border }]}
                >
                  <Text style={[styles.leafCode, tabularNums, { color: theme.textSecondary }]}>{x.code}</Text>
                  <Text style={[styles.leafLabel, { color: theme.textPrimary }]} numberOfLines={1}>
                    {x.label}
                  </Text>
                  <Text style={[styles.leafAmount, tabularNums, { color: theme.textPrimary }]}>{signed(x.amount)}</Text>
                </Pressable>
              </Animated.View>
            ))
          : null}
      </View>

      <Text style={[styles.footnote, { color: theme.textSecondary }]}>Figures unaudited · posted entries update this sheet live</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  checkCard: { padding: 15, gap: 12 },
  checkRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 },
  checkLabel: { fontFamily: fontFamily.mono, fontSize: 10, letterSpacing: 0.12 * 10, textTransform: 'uppercase' },
  checkValue: { fontSize: 22, fontWeight: '600', letterSpacing: -0.02 * 22, lineHeight: 22 },
  divider: { height: 1 },
  balancePill: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 11, paddingVertical: 9, paddingHorizontal: 11 },
  balanceLabel: { flex: 1, fontSize: 12.5, fontWeight: '600' },
  balanceDiff: { fontFamily: fontFamily.mono, fontSize: 11 },

  tableCard: { borderRadius: radii.lg, overflow: 'hidden' },
  tableHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11, paddingHorizontal: 15, borderBottomWidth: StyleSheet.hairlineWidth },
  tableHeadCode: { width: 40, fontFamily: fontFamily.mono, fontSize: 9.5, letterSpacing: 0.1 * 9.5, textTransform: 'uppercase' },
  tableHeadLabel: { flex: 1, fontFamily: fontFamily.mono, fontSize: 9.5, letterSpacing: 0.1 * 9.5, textTransform: 'uppercase' },
  tableHeadAmount: { fontFamily: fontFamily.mono, fontSize: 9.5, letterSpacing: 0.1 * 9.5, textTransform: 'uppercase' },

  chartRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingRight: 15 },
  chevronOpen: { transform: [{ rotate: '90deg' }] },
  leafCode: { width: 40, fontSize: 10 },
  groupTopLabel: { flex: 1, fontFamily: fontFamily.semibold, fontSize: 12, letterSpacing: 0.1 * 12, textTransform: 'uppercase' },
  groupLabel: { flex: 1, fontFamily: fontFamily.semibold, fontSize: 13 },
  leafLabel: { flex: 1, fontSize: 13.5 },
  groupTopAmount: { fontSize: 14, fontWeight: '600' },
  groupAmount: { fontSize: 13.5, fontWeight: '600' },
  leafAmount: { fontFamily: fontFamily.mono, fontSize: 12.5 },

  expenseHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 13, paddingHorizontal: 15 },
  expenseHeaderText: { flex: 1, gap: 2, minWidth: 0 },
  expenseTitle: { fontFamily: fontFamily.mono, fontSize: 10, letterSpacing: 0.1 * 10, textTransform: 'uppercase', fontWeight: '500' },
  expenseSub: { fontFamily: fontFamily.mono, fontSize: 9.5 },
  expenseTotal: { fontFamily: fontFamily.mono, fontSize: 13, fontWeight: '500' },
  expenseRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11, paddingHorizontal: 15, borderTopWidth: StyleSheet.hairlineWidth },

  footnote: { fontFamily: fontFamily.mono, fontSize: 10, lineHeight: 10 * 1.5, paddingHorizontal: 4 },
});
