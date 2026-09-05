import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Icon } from '@/components/ui/icon';
import { useTheme } from '@/theme/theme-provider';
import { fontFamily } from '@/theme';

export interface CancelledSectionProps {
  /** e.g. "Cancelled invoices" — the count is appended. */
  label: string;
  count: number;
  children: ReactNode;
}

/**
 * Cancelled documents are never deleted (IRD keeps the record), but they don't
 * belong in the working list either. Same treatment as the website: a collapsed
 * block at the bottom that opens on tap, dimmed to read as an archive.
 */
export function CancelledSection({ label, count, children }: CancelledSectionProps) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  if (count === 0) return null;

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        style={({ pressed }) => [
          styles.header,
          {
            backgroundColor: theme.surface,
            borderColor: theme.scheme === 'light' ? '#E3C9BE' : theme.border,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        <Icon name="x-circle" size={16} color={theme.dangerWashText} />
        <Text style={[styles.title, { color: theme.dangerWashText }]}>{label}</Text>
        <View style={[styles.count, { backgroundColor: theme.dangerWash }]}>
          <Text style={[styles.countText, { color: theme.dangerWashText }]}>{count}</Text>
        </View>
        <View style={styles.flex1} />
        <Text style={[styles.toggle, { color: theme.textSecondary }]}>{open ? 'Hide' : 'Show'}</Text>
        <Icon name={open ? 'chevron-up' : 'chevron-down'} size={15} color={theme.textSecondary} />
      </Pressable>

      {open ? (
        <Animated.View entering={FadeIn.duration(160)} style={styles.rows}>
          {children}
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10, paddingTop: 4 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  title: { fontFamily: fontFamily.semibold, fontSize: 13.5 },
  count: { minWidth: 22, paddingHorizontal: 6, height: 20, borderRadius: 99, alignItems: 'center', justifyContent: 'center' },
  countText: { fontFamily: fontFamily.mono, fontSize: 10.5 },
  flex1: { flex: 1 },
  toggle: { fontFamily: fontFamily.mono, fontSize: 10.5 },
  // Cancelled records read as an archive, not as live work.
  rows: { gap: 12, opacity: 0.62 },
});
