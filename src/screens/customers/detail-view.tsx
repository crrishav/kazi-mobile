import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useTheme } from '@/theme/theme-provider';
import { fontFamily, tabularNums } from '@/theme';
import { STAGE } from '@/data/customers/mock';
import type { Customer } from '@/data/customers/types';
import { gbp, hasOverdue, lifetime, owed } from '@/data/customers/utils';

export interface DetailViewProps {
  customer: Customer;
  onDelete: () => void;
}

export function DetailView({ customer, onDelete }: DetailViewProps) {
  const theme = useTheme();
  const balance = owed(customer);
  const overdue = hasOverdue(customer);
  const status = overdue ? 'Overdue' : balance ? 'Open balance' : 'Settled';
  const pillBg = overdue ? theme.onDark.dangerWash : balance ? theme.onDark.warningWash : theme.onDark.accentWash;
  const pillFg = overdue ? theme.onDark.dangerWashText : balance ? theme.onDark.warningWashText : theme.onDark.accentWashText;
  const balanceLine = balance
    ? `${gbp(balance)} outstanding across ${customer.invoices.filter((v) => v.status !== 'paid').length} invoice(s)`
    : 'Nothing outstanding';

  const contactRows = [
    { label: 'Contact', value: `${customer.contact} · ${customer.role}`, action: null as 'mail' | 'call' | null },
    { label: 'Email', value: customer.email, action: 'mail' as const },
    { label: 'Phone', value: customer.phone, action: 'call' as const },
    { label: 'Address', value: customer.address, action: null },
    { label: 'Payment terms', value: customer.terms, action: null },
  ];

  return (
    <Animated.View entering={FadeInUp.duration(220)} style={styles.wrap}>
      <Card elevation="inverted" style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View style={styles.gap5}>
            <Text style={[styles.eyebrow, { color: theme.onDark.textMuted }]}>Invoiced to date</Text>
            <Text style={[styles.summaryValue, tabularNums, { color: theme.onDark.text }]}>{gbp(lifetime(customer))}</Text>
          </View>
          <View style={[styles.pill, { backgroundColor: pillBg }]}>
            <View style={[styles.pillDot, { backgroundColor: pillFg }]} />
            <Text style={[styles.pillLabel, { color: pillFg }]}>{status}</Text>
          </View>
        </View>
        <View style={[styles.divider, { backgroundColor: 'rgba(233,241,236,0.14)' }]} />
        <View style={styles.balanceRow}>
          <Text style={[styles.balanceLine, { color: theme.onDark.avatarText }]}>{balanceLine}</Text>
          <Text style={[styles.since, tabularNums, { color: theme.onDark.textMuted }]}>{customer.since}</Text>
        </View>
      </Card>

      <Card elevation="raised" style={styles.contactCard}>
        {contactRows.map((row, i) => (
          <View key={row.label} style={[styles.contactRow, i < contactRows.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border }]}>
            <View style={styles.contactTextWrap}>
              <Text style={[styles.contactLabel, { color: theme.textSecondary }]}>{row.label}</Text>
              <Text style={[styles.contactValue, { color: theme.textPrimary }]}>{row.value}</Text>
            </View>
            {row.action ? (
              <Pressable
                onPress={() => Linking.openURL(row.action === 'mail' ? `mailto:${customer.email}` : `tel:${customer.phone.replace(/\s+/g, '')}`)}
                style={[styles.actionChip, { backgroundColor: theme.accentWash }]}
              >
                <Text style={[styles.actionChipText, { color: theme.accentWashText }]}>{row.action}</Text>
              </Pressable>
            ) : null}
          </View>
        ))}
      </Card>

      <Card elevation="raised" style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Open orders</Text>
          <Text style={[styles.sectionMeta, tabularNums, { color: theme.textSecondary }]}>{customer.orders.length} live</Text>
        </View>
        {customer.orders.length === 0 ? (
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Nothing in production for this account right now.</Text>
        ) : (
          customer.orders.map((o, i) => {
            const s = STAGE[o.stage];
            return (
              <View key={i} style={styles.orderRow}>
                <View style={styles.orderTextWrap}>
                  <Text style={[styles.orderProduct, { color: theme.textPrimary }]}>{o.product}</Text>
                  <Text style={[styles.orderMeta, tabularNums, { color: theme.textSecondary }]}>{o.meta}</Text>
                </View>
                <View style={[styles.pill, { backgroundColor: s.bg }]}>
                  <View style={[styles.pillDot, { backgroundColor: s.dot }]} />
                  <Text style={[styles.pillLabel, { color: s.fg }]}>{s.label}</Text>
                </View>
              </View>
            );
          })
        )}
      </Card>

      <Card elevation="raised" style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Invoices</Text>
          <Text style={[styles.sectionMeta, tabularNums, { color: theme.textSecondary }]}>
            {customer.invoices.length} total · {gbp(lifetime(customer))}
          </Text>
        </View>
        {customer.invoices.map((v) => {
          const fg = v.status === 'paid' ? theme.accentWashText : v.status === 'overdue' ? theme.dangerWashText : theme.warningWashText;
          const label = v.status === 'paid' ? 'Paid' : v.status === 'overdue' ? 'Overdue' : 'Open';
          return (
            <View key={v.ref} style={styles.invoiceRow}>
              <View style={styles.orderTextWrap}>
                <Text style={[styles.invoiceRef, tabularNums, { color: theme.textPrimary }]}>{v.ref}</Text>
                <Text style={[styles.orderMeta, tabularNums, { color: theme.textSecondary }]}>{v.due}</Text>
              </View>
              <Text style={[styles.invoiceAmount, tabularNums, { color: theme.textPrimary }]}>{gbp(v.amount)}</Text>
              <Text style={[styles.invoiceStatus, { color: fg }]}>{label}</Text>
            </View>
          );
        })}
      </Card>

      <Button label="Delete customer" variant="dangerOutline" onPress={onDelete} fullWidth />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  summaryCard: { padding: 18, gap: 14 },
  summaryRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 14 },
  gap5: { gap: 5 },
  eyebrow: { fontFamily: fontFamily.mono, fontSize: 10, letterSpacing: 0.12 * 10, textTransform: 'uppercase' },
  summaryValue: { fontFamily: fontFamily.semibold, fontSize: 30, letterSpacing: -0.03 * 30, lineHeight: 30 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 28, paddingHorizontal: 11, borderRadius: 999 },
  pillDot: { width: 6, height: 6, borderRadius: 99 },
  pillLabel: { fontSize: 12.5, fontWeight: '600' },
  divider: { height: 1 },
  balanceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  balanceLine: { flex: 1, fontSize: 13, lineHeight: 13 * 1.4 },
  since: { fontFamily: fontFamily.mono, fontSize: 10.5, flexShrink: 0 },
  contactCard: { paddingHorizontal: 16, paddingVertical: 2 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13 },
  contactTextWrap: { flex: 1, gap: 3, minWidth: 0 },
  contactLabel: { fontFamily: fontFamily.mono, fontSize: 9.5, letterSpacing: 0.11 * 9.5, textTransform: 'uppercase' },
  contactValue: { fontSize: 14.5, lineHeight: 14.5 * 1.35 },
  actionChip: { borderRadius: 9, paddingHorizontal: 9, paddingVertical: 6, flexShrink: 0 },
  actionChipText: { fontFamily: fontFamily.mono, fontSize: 10.5, letterSpacing: 0.06 * 10.5, textTransform: 'uppercase' },
  section: { padding: 16, gap: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 },
  sectionTitle: { fontFamily: fontFamily.semibold, fontSize: 15 },
  sectionMeta: { fontFamily: fontFamily.mono, fontSize: 10.5 },
  emptyText: { fontSize: 13 },
  orderRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  orderTextWrap: { flex: 1, gap: 3, minWidth: 0 },
  orderProduct: { fontSize: 14.5, fontWeight: '600', lineHeight: 14.5 * 1.25 },
  orderMeta: { fontFamily: fontFamily.mono, fontSize: 10.5 },
  invoiceRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  invoiceRef: { fontFamily: fontFamily.mono, fontSize: 12.5 },
  invoiceAmount: { fontSize: 14.5, fontWeight: '600', flexShrink: 0 },
  invoiceStatus: { width: 74, textAlign: 'right', fontSize: 12, fontWeight: '600', flexShrink: 0 },
});
