import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Money } from '@/components/ui/money';
import { useTheme } from '@/theme/theme-provider';
import { fontFamily, tabularNums, type Theme } from '@/theme';
import type { AccountLedger, AccountSummary } from '@/data/finance/ledger';
import type { AccountType } from '@/data/finance/types';

export interface AccountLedgerViewProps {
  ledgers: AccountLedger[];
  summaries: AccountSummary[];
  canEdit: boolean;
  /** Tap the opening-balance chip on a Cash/Bank card. */
  onEditOpening: (accountName: string, current: number) => void;
}

const npr = (n: number) => `रु ${Math.round(n).toLocaleString('en-IN')}`;

function typeColor(theme: Theme, type: AccountType, balance: number): string {
  if (type === 'Asset' || type === 'Expense') return balance >= 0 ? theme.textPrimary : theme.dangerWashText;
  return balance >= 0 ? theme.accentWashText : theme.dangerWashText;
}

export function AccountLedgerView({ ledgers, summaries, canEdit, onEditOpening }: AccountLedgerViewProps) {
  const theme = useTheme();

  const otherAccounts = summaries.filter((s) => !ledgers.some((l) => l.account === s.name) && (s.count > 0 || s.balance !== 0));

  return (
    <View style={styles.wrap}>
      {ledgers.map((l) => (
        <View key={l.account} style={[styles.card, { backgroundColor: theme.surface, boxShadow: theme.shadows.card }]}>
          <View style={styles.cardHead}>
            <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>{l.account}</Text>
            <Money npr={l.closing} size={16} align="right" />
          </View>
          <Pressable
            onPress={canEdit ? () => onEditOpening(l.account, l.opening) : undefined}
            style={[styles.openingChip, { backgroundColor: theme.draftWash }]}
          >
            <Text style={[styles.openingText, tabularNums, { color: theme.textSecondary }]}>
              Opening {npr(l.opening)}
              {canEdit ? ' · edit' : ''}
            </Text>
          </Pressable>

          <View style={[styles.tableHead, { borderBottomColor: theme.border }]}>
            <Text style={[styles.thParticulars, { color: theme.textSecondary }]}>Particulars</Text>
            <Text style={[styles.thNum, { color: theme.textSecondary }]}>Dr</Text>
            <Text style={[styles.thNum, { color: theme.textSecondary }]}>Cr</Text>
            <Text style={[styles.thNum, { color: theme.textSecondary }]}>Balance</Text>
          </View>

          {l.rows.length === 0 ? (
            <Text style={[styles.emptyRow, { color: theme.textSecondary }]}>No movements yet</Text>
          ) : (
            l.rows.map((r, i) => (
              <View key={i} style={[styles.tr, { borderBottomColor: theme.background }]}>
                <View style={styles.tdParticulars}>
                  <Text style={[styles.rowTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                    {r.particulars}
                  </Text>
                  <Text style={[styles.rowRef, tabularNums, { color: theme.textSecondary }]} numberOfLines={1}>
                    {r.ref}
                  </Text>
                </View>
                <Text style={[styles.tdNum, tabularNums, { color: r.dr ? theme.accentWashText : theme.textSecondary }]}>
                  {r.dr ? npr(r.dr).replace('रु ', '') : '—'}
                </Text>
                <Text style={[styles.tdNum, tabularNums, { color: r.cr ? theme.dangerWashText : theme.textSecondary }]}>
                  {r.cr ? npr(r.cr).replace('रु ', '') : '—'}
                </Text>
                <Text style={[styles.tdNum, tabularNums, { color: theme.textPrimary, fontWeight: '600' }]}>
                  {npr(r.balance).replace('रु ', '')}
                </Text>
              </View>
            ))
          )}
        </View>
      ))}

      {otherAccounts.length > 0 ? (
        <>
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Other accounts</Text>
          <View style={styles.grid}>
            {otherAccounts.map((s) => (
              <View key={s.id} style={[styles.gridCard, { backgroundColor: theme.surface, boxShadow: theme.shadows.card }]}>
                <View style={styles.gridHead}>
                  <Text style={[styles.gridName, { color: theme.textPrimary }]} numberOfLines={1}>
                    {s.name}
                  </Text>
                  <View style={[styles.typePill, { backgroundColor: theme.draftWash }]}>
                    <Text style={[styles.typePillText, { color: theme.textSecondary }]}>{s.type}</Text>
                  </View>
                </View>
                <Text style={[styles.gridBalance, tabularNums, { color: typeColor(theme, s.type, s.balance) }]}>
                  {npr(s.balance)}
                </Text>
                <Text style={[styles.gridMeta, tabularNums, { color: theme.textSecondary }]}>
                  Dr {npr(s.dr).replace('रु ', '')} · Cr {npr(s.cr).replace('रु ', '')} · {s.count} {s.count === 1 ? 'entry' : 'entries'}
                </Text>
              </View>
            ))}
          </View>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 14 },
  card: { borderRadius: 18, padding: 15, gap: 10 },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  cardTitle: { fontFamily: fontFamily.semibold, fontSize: 15 },
  openingChip: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  openingText: { fontFamily: fontFamily.mono, fontSize: 10 },
  tableHead: { flexDirection: 'row', borderBottomWidth: 1, paddingBottom: 6, marginTop: 2 },
  thParticulars: { flex: 1, fontFamily: fontFamily.mono, fontSize: 9, letterSpacing: 0.1 * 9, textTransform: 'uppercase' },
  thNum: { width: 64, textAlign: 'right', fontFamily: fontFamily.mono, fontSize: 9, letterSpacing: 0.1 * 9, textTransform: 'uppercase' },
  emptyRow: { fontSize: 12, paddingVertical: 8 },
  tr: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1 },
  tdParticulars: { flex: 1, gap: 2, minWidth: 0, paddingRight: 6 },
  rowTitle: { fontSize: 12.5, fontWeight: '600' },
  rowRef: { fontFamily: fontFamily.mono, fontSize: 9.5 },
  tdNum: { width: 64, textAlign: 'right', fontSize: 11, fontFamily: fontFamily.mono },
  sectionLabel: { fontFamily: fontFamily.mono, fontSize: 10.5, letterSpacing: 0.12 * 10.5, textTransform: 'uppercase', paddingHorizontal: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gridCard: { width: '47%', flexGrow: 1, borderRadius: 16, padding: 13, gap: 6 },
  gridHead: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'space-between' },
  gridName: { flex: 1, fontSize: 12.5, fontWeight: '600' },
  typePill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  typePillText: { fontFamily: fontFamily.mono, fontSize: 8.5, textTransform: 'uppercase' },
  gridBalance: { fontSize: 15, fontWeight: '600' },
  gridMeta: { fontFamily: fontFamily.mono, fontSize: 9 },
});
