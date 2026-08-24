import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { useTheme } from '@/theme/theme-provider';
import { fontFamily, tabularNums } from '@/theme';
import { CATEGORIES, MARGINS } from '@/data/finance/mock';
import { lakh, rupees } from '@/data/finance/utils';
import type { Expense } from '@/data/finance/types';

export interface OverviewProps {
  expenses: Expense[];
  onBrowseYears: () => void;
}

export function Overview({ expenses, onBrowseYears }: OverviewProps) {
  const theme = useTheme();
  const maxMargin = Math.max(...MARGINS);
  const expenseSum = expenses.reduce((n, e) => n + e.amount, 0);

  return (
    <View style={styles.group}>
      <Card elevation="inverted" style={styles.marginCard}>
        <View style={styles.marginTopRow}>
          <View style={styles.gap6}>
            <Text style={[styles.eyebrow, { color: theme.onDark.textMuted }]}>Average margin</Text>
            <View style={styles.baselineRow}>
              <Text style={[styles.marginValue, tabularNums, { color: theme.onDark.text }]}>22.4%</Text>
              <Text style={[styles.marginDelta, { color: theme.onDark.accent }]}>+1.6 pts</Text>
            </View>
          </View>
          <View style={[styles.gap5, styles.alignEnd]}>
            <Text style={[styles.eyebrow, { color: theme.onDark.textMuted }]}>Net position</Text>
            <Text style={[styles.netValue, tabularNums, { color: theme.onDark.text }]}>+रु 41.2L</Text>
          </View>
        </View>
        <View style={styles.marginChart}>
          {MARGINS.map((m, i) => (
            <View key={i} style={styles.marginBarWrap}>
              <View
                style={[
                  styles.marginBar,
                  {
                    height: `${(m / maxMargin) * 100}%`,
                    backgroundColor: i === MARGINS.length - 1 ? theme.onDark.accent : 'rgba(191,233,213,0.42)',
                  },
                ]}
              />
            </View>
          ))}
        </View>
        <View style={styles.marginLabels}>
          <Text style={[styles.marginLabel, { color: theme.onDark.textMuted }]}>Shrawan</Text>
          <Text style={[styles.marginLabel, { color: theme.onDark.textMuted }]}>12 months</Text>
          <Text style={[styles.marginLabel, { color: theme.onDark.textMuted }]}>Ashad</Text>
        </View>
      </Card>

      <View style={styles.pairRow}>
        <Card elevation="raised" style={[styles.pairCard, { borderLeftColor: theme.danger }]}>
          <Text style={[styles.pairLabel, { color: theme.textSecondary }]}>Payable</Text>
          <Text style={[styles.pairValue, tabularNums, { color: theme.textPrimary }]}>रु 92.4L</Text>
          <View style={[styles.pairPill, { backgroundColor: theme.dangerWash }]}>
            <View style={[styles.pairDot, { backgroundColor: theme.danger }]} />
            <Text style={[styles.pairPillText, { color: theme.dangerWashText }]}>रु 18.8L overdue</Text>
          </View>
          <Text style={[styles.pairMeta, tabularNums, { color: theme.textSecondary }]}>14 bills · 4 suppliers</Text>
        </Card>
        <Card elevation="raised" style={[styles.pairCard, { borderLeftColor: theme.accent }]}>
          <Text style={[styles.pairLabel, { color: theme.textSecondary }]}>Receivable</Text>
          <Text style={[styles.pairValue, tabularNums, { color: theme.textPrimary }]}>रु 133.6L</Text>
          <View style={[styles.pairPill, { backgroundColor: theme.accentWash }]}>
            <View style={[styles.pairDot, { backgroundColor: theme.scheme === 'light' ? '#22A97A' : theme.accent }]} />
            <Text style={[styles.pairPillText, { color: theme.accentWashText }]}>रु 31.5L this week</Text>
          </View>
          <Text style={[styles.pairMeta, tabularNums, { color: theme.textSecondary }]}>9 invoices · 6 customers</Text>
        </Card>
      </View>

      <Pressable onPress={onBrowseYears} style={[styles.browseCard, { backgroundColor: theme.surface, boxShadow: theme.shadows.card }]}>
        <View style={[styles.browseIcon, { backgroundColor: theme.draftWash }]}>
          <Icon name="calendar" size={20} color={theme.textSecondary} />
        </View>
        <View style={styles.browseTextWrap}>
          <Text style={[styles.browseTitle, { color: theme.textPrimary }]}>Browse by fiscal year</Text>
          <Text style={[styles.browseMeta, tabularNums, { color: theme.textSecondary }]}>Bank · journal · expenses · 4 years</Text>
        </View>
        <Icon name="chevron-right" size={16} color={theme.textSecondary} />
      </Pressable>

      <View style={styles.expensesHeader}>
        <Text style={[styles.expensesTitle, { color: theme.textSecondary }]}>Expenses · this month</Text>
        <Text style={[styles.expensesTotal, tabularNums, { color: theme.textPrimary }]}>{lakh(expenseSum)}</Text>
      </View>

      {expenses.map((e) => {
        const cat = CATEGORIES.find((c) => c.id === e.cat) ?? CATEGORIES[5];
        return (
          <View key={e.id} style={[styles.expenseRow, { backgroundColor: theme.surface, boxShadow: theme.shadows.card }]}>
            <View style={[styles.expenseTag, { backgroundColor: cat.bg }]}>
              <Text style={[styles.expenseTagText, { color: cat.fg }]}>{cat.tag}</Text>
            </View>
            <View style={styles.expenseTextWrap}>
              <Text style={[styles.expenseName, { color: theme.textPrimary }]} numberOfLines={1}>
                {e.name}
              </Text>
              <Text style={[styles.expenseMeta, tabularNums, { color: theme.textSecondary }]} numberOfLines={1}>
                {e.meta}
              </Text>
            </View>
            <View style={styles.expenseRight}>
              <Text style={[styles.expenseAmount, tabularNums, { color: theme.textPrimary }]}>{rupees(e.amount)}</Text>
              <View style={[styles.statusPill, { backgroundColor: e.status === 'paid' ? theme.accentWash : theme.dangerWash }]}>
                <Text style={[styles.statusPillText, { color: e.status === 'paid' ? theme.accentWashText : theme.dangerWashText }]}>
                  {e.status === 'paid' ? 'Paid' : 'Unpaid'}
                </Text>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: 12 },
  marginCard: { padding: 17, gap: 14 },
  marginTopRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 14 },
  gap6: { gap: 6 },
  gap5: { gap: 5 },
  alignEnd: { alignItems: 'flex-end' },
  eyebrow: { fontFamily: fontFamily.mono, fontSize: 10, letterSpacing: 0.12 * 10, textTransform: 'uppercase' },
  baselineRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  marginValue: { fontFamily: fontFamily.semibold, fontSize: 34, letterSpacing: -0.03 * 34 },
  marginDelta: { fontSize: 13, fontWeight: '600' },
  netValue: { fontSize: 17, fontWeight: '600' },
  marginChart: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 44 },
  marginBarWrap: { flex: 1, justifyContent: 'flex-end', height: '100%' },
  marginBar: { borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  marginLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  marginLabel: { fontFamily: fontFamily.mono, fontSize: 9.5, letterSpacing: 0.08 * 9.5, textTransform: 'uppercase' },
  pairRow: { flexDirection: 'row', gap: 10 },
  pairCard: { flex: 1, padding: 15, gap: 9, borderLeftWidth: 4 },
  pairLabel: { fontFamily: fontFamily.mono, fontSize: 9.5, letterSpacing: 0.11 * 9.5, textTransform: 'uppercase' },
  pairValue: { fontFamily: fontFamily.semibold, fontSize: 26, letterSpacing: -0.03 * 26 },
  pairPill: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 22, paddingHorizontal: 8, borderRadius: 999, alignSelf: 'flex-start' },
  pairDot: { width: 5, height: 5, borderRadius: 99 },
  pairPillText: { fontSize: 11, fontWeight: '600' },
  pairMeta: { fontFamily: fontFamily.mono, fontSize: 10 },
  browseCard: { flexDirection: 'row', alignItems: 'center', gap: 13, borderRadius: 18, padding: 15 },
  browseIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  browseTextWrap: { flex: 1, gap: 3, minWidth: 0 },
  browseTitle: { fontSize: 15, fontWeight: '600' },
  browseMeta: { fontFamily: fontFamily.mono, fontSize: 10.5 },
  expensesHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingHorizontal: 2, paddingTop: 6 },
  expensesTitle: { fontFamily: fontFamily.mono, fontSize: 10.5, letterSpacing: 0.12 * 10.5, textTransform: 'uppercase' },
  expensesTotal: { fontFamily: fontFamily.mono, fontSize: 11 },
  expenseRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 18, padding: 14 },
  expenseTag: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  expenseTagText: { fontFamily: fontFamily.mono, fontSize: 11, letterSpacing: 0.04 * 11 },
  expenseTextWrap: { flex: 1, gap: 4, minWidth: 0 },
  expenseName: { fontSize: 14.5, fontWeight: '600' },
  expenseMeta: { fontFamily: fontFamily.mono, fontSize: 10.5 },
  expenseRight: { alignItems: 'flex-end', gap: 4 },
  expenseAmount: { fontSize: 15, fontWeight: '600' },
  statusPill: { height: 22, paddingHorizontal: 8, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  statusPillText: { fontSize: 11, fontWeight: '600' },
});
