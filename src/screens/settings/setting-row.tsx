import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/theme-provider';
import { fontFamily } from '@/theme';

export interface SettingRowProps {
  label: string;
  /** One line explaining what the choice actually changes. */
  meta: string;
  children: ReactNode;
}

/**
 * The shared card shell for a Settings control. Stacked rather than
 * label-beside-control: the appearance row has three options, which crowds a
 * side-by-side layout on a small phone, and stacking keeps all three rows
 * reading the same way.
 */
export function SettingRow({ label, meta, children }: SettingRowProps) {
  const theme = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, boxShadow: theme.shadows.card }]}>
      <View style={styles.textWrap}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
        <Text style={[styles.meta, { color: theme.textSecondary }]}>{meta}</Text>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: 12, borderRadius: 18, padding: 15 },
  textWrap: { gap: 3 },
  label: {
    fontFamily: fontFamily.mono,
    fontSize: 10,
    letterSpacing: 0.12 * 10,
    textTransform: 'uppercase',
  },
  meta: { fontSize: 12, lineHeight: 12 * 1.4 },
});
