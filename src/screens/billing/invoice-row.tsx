import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { Avatar } from '@/components/ui/avatar';
import { useTheme } from '@/theme/theme-provider';
import { fontFamily, tabularNums } from '@/theme';
import { CLIENTS, PILL } from '@/data/billing/mock';
import type { Invoice } from '@/data/billing/types';
import { money, npr, nprOf, paid, status, total as invTotal } from '@/data/billing/utils';

export interface InvoiceRowProps {
  invoice: Invoice;
  index: number;
  showFx: boolean;
  onPress: () => void;
}

export function InvoiceRow({ invoice: v, index, showFx, onPress }: InvoiceRowProps) {
  const theme = useTheme();
  const client = CLIENTS[v.client];
  const st = status(v);
  const pill = PILL[st];
  const tot = invTotal(v);
  const pd = paid(v);
  const part = st === 'accepted' && pd > 0.5;
  const late = v.dueDays < 0 && st === 'accepted';
  const challanLabel = v.challans.length > 1 ? `${v.challans[0].no} +${v.challans.length - 1}` : v.challans[0].no;
  const due = v.cancelled ? 'voided' : st === 'collected' ? 'settled' : late ? `due ${v.due} · ${Math.abs(v.dueDays)}d late` : `due ${v.due}`;
  const paidPct = Math.min(100, (pd / tot) * 100);

  return (
    <Animated.View entering={FadeInUp.delay(Math.min(index, 6) * 30).duration(220)}>
      <Pressable
        onPress={onPress}
        style={[styles.card, { backgroundColor: theme.surface, boxShadow: theme.shadows.card, borderLeftColor: pill.accent }]}
      >
        <View style={styles.topRow}>
          <Avatar initials={client.initials} tint={index % 2 === 0 ? 'mint' : 'dark'} size="md" />
          <View style={styles.textWrap}>
            <Text style={[styles.client, { color: theme.textPrimary }]} numberOfLines={1}>
              {client.name}
            </Text>
            <Text style={[styles.sub, tabularNums, { color: theme.textSecondary }]} numberOfLines={1}>
              {v.ref} · {v.so} · {v.issued}
            </Text>
          </View>
          <View style={styles.amountCol}>
            <Text
              style={[
                styles.amount,
                tabularNums,
                { color: v.cancelled ? theme.textSecondary : theme.textPrimary, textDecorationLine: v.cancelled ? 'line-through' : 'none' },
              ]}
            >
              {npr(nprOf(v, tot))}
            </Text>
            {showFx && v.cur !== 'NPR' ? <Text style={[styles.fxAmount, tabularNums, { color: theme.textSecondary }]}>{money(v.cur, tot)}</Text> : null}
          </View>
        </View>

        {part ? (
          <View style={styles.progressWrap}>
            <View style={[styles.progressTrack, { backgroundColor: theme.draftWash }]}>
              <View style={[styles.progressFill, { width: `${paidPct}%`, backgroundColor: theme.accent }]} />
            </View>
            <Text style={[styles.progressMeta, tabularNums, { color: theme.textSecondary }]}>
              {money(v.cur, pd)} of {money(v.cur, tot)} collected
            </Text>
          </View>
        ) : null}

        <View style={styles.bottomRow}>
          <View style={[styles.pill, { backgroundColor: pill.bg }]}>
            <View style={[styles.pillDot, { backgroundColor: pill.dot }]} />
            <Text style={[styles.pillLabel, { color: pill.fg }]}>{pill.label}</Text>
          </View>
          <View style={[styles.challanChip, { backgroundColor: theme.draftWash }]}>
            <Text style={[styles.challanText, tabularNums, { color: theme.textPrimary }]}>{challanLabel}</Text>
          </View>
          <View style={styles.flex1} />
          <Text style={[styles.due, tabularNums, { color: late ? theme.dangerWashText : theme.textSecondary }]}>{due}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 20, padding: 15, gap: 11, borderLeftWidth: 4 },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 11 },
  textWrap: { flex: 1, gap: 3, minWidth: 0 },
  client: { fontFamily: fontFamily.semibold, fontSize: 15.5, letterSpacing: -0.01 * 15.5 },
  sub: { fontFamily: fontFamily.mono, fontSize: 10.5 },
  amountCol: { alignItems: 'flex-end', gap: 3, flexShrink: 0 },
  amount: { fontSize: 14.5, fontWeight: '600' },
  fxAmount: { fontFamily: fontFamily.mono, fontSize: 10.5 },
  progressWrap: { gap: 5 },
  progressTrack: { height: 5, borderRadius: 99, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 99 },
  progressMeta: { fontFamily: fontFamily.mono, fontSize: 10 },
  bottomRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 26, paddingHorizontal: 10, borderRadius: 999 },
  pillDot: { width: 6, height: 6, borderRadius: 99 },
  pillLabel: { fontSize: 12, fontWeight: '600' },
  challanChip: { height: 26, paddingHorizontal: 9, borderRadius: 8, justifyContent: 'center' },
  challanText: { fontFamily: fontFamily.mono, fontSize: 10.5 },
  flex1: { flex: 1 },
  due: { fontFamily: fontFamily.mono, fontSize: 10.5 },
});
