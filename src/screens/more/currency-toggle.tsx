import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useCurrency } from '@/lib/currency-context';
import { CURRENCY_SYMBOL, GBP_RATE, type Currency } from '@/lib/currency';
import { useTheme } from '@/theme/theme-provider';
import { fontFamily } from '@/theme';

const OPTIONS: { cur: Currency; label: string }[] = [
  { cur: 'NPR', label: 'NPR' },
  { cur: 'GBP', label: 'GBP' },
];

/** More-screen control for the app-wide primary currency (plan item 1 / §2.3). */
export function CurrencyToggle() {
  const theme = useTheme();
  const { primary, setPrimary } = useCurrency();

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, boxShadow: theme.shadows.card }]}>
      <View style={styles.textWrap}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>Currency</Text>
        <Text style={[styles.meta, { color: theme.textSecondary }]}>
          Amounts show {primary} first · 1 {CURRENCY_SYMBOL.GBP} = {GBP_RATE} {CURRENCY_SYMBOL.NPR}
        </Text>
      </View>
      <View style={[styles.segment, { backgroundColor: theme.draftWash }]}>
        {OPTIONS.map((opt) => {
          const active = opt.cur === primary;
          return (
            <Pressable
              key={opt.cur}
              onPress={() => setPrimary(opt.cur)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={[styles.segmentItem, active && { backgroundColor: theme.surface, boxShadow: theme.shadows.card }]}
            >
              <Text style={[styles.segmentText, { color: active ? theme.textPrimary : theme.textSecondary }]}>{opt.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderRadius: 18,
    padding: 15,
  },
  textWrap: { flex: 1, gap: 3, minWidth: 0 },
  label: {
    fontFamily: fontFamily.mono,
    fontSize: 10,
    letterSpacing: 0.12 * 10,
    textTransform: 'uppercase',
  },
  meta: { fontSize: 12, lineHeight: 12 * 1.4 },
  segment: { flexDirection: 'row', borderRadius: 10, padding: 3, gap: 3 },
  segmentItem: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, alignItems: 'center' },
  segmentText: { fontFamily: fontFamily.semibold, fontSize: 12.5 },
});
