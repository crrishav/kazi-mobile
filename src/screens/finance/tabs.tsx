import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/theme-provider';
import { fontFamily, tabularNums } from '@/theme';

export interface FinanceTabDef<T extends string> {
  id: T;
  label: string;
  /** Optional count badge (e.g. unpaid expenses, VAT bills). */
  count?: number;
}

export interface FinanceTabsProps<T extends string> {
  tabs: FinanceTabDef<T>[];
  active: T;
  onChange: (id: T) => void;
}

/**
 * Horizontal tab strip for the Finance hub. The reference `Finance.jsx` is a
 * 9-tab page; mobile adds tabs here as each one is built (plan items 6–11).
 */
export function FinanceTabs<T extends string>({ tabs, active, onChange }: FinanceTabsProps<T>) {
  const theme = useTheme();

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {tabs.map((t) => {
        const on = t.id === active;
        return (
          <Pressable
            key={t.id}
            onPress={() => onChange(t.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            style={[styles.tab, { backgroundColor: on ? theme.surfaceInverted : theme.surface, borderColor: on ? theme.surfaceInverted : theme.border }]}
          >
            <Text style={[styles.label, { color: on ? theme.onDark.text : theme.textPrimary }]}>{t.label}</Text>
            {typeof t.count === 'number' && t.count > 0 ? (
              <View style={[styles.badge, { backgroundColor: on ? theme.onDark.accentWash : theme.draftWash }]}>
                <Text style={[styles.badgeText, tabularNums, { color: on ? theme.onDark.text : theme.textSecondary }]}>{t.count}</Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 7, paddingHorizontal: 20, paddingBottom: 12 },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 34, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1 },
  label: { fontFamily: fontFamily.semibold, fontSize: 12.5 },
  badge: { minWidth: 18, height: 18, paddingHorizontal: 5, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontFamily: fontFamily.mono, fontSize: 10 },
});
