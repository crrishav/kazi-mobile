import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/theme-provider';
import { fontFamily } from '@/theme';

export interface FormHeaderProps {
  title: string;
  saveLabel: string;
  saveEnabled: boolean;
  onCancel: () => void;
  onSave: () => void;
}

export function FormHeader({ title, saveLabel, saveEnabled, onCancel, onSave }: FormHeaderProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.row, { paddingTop: insets.top + 12, borderBottomColor: theme.border, backgroundColor: theme.background }]}>
      <Pressable onPress={onCancel} style={styles.side} hitSlop={8}>
        <Text style={[styles.cancel, { color: theme.textSecondary }]}>Cancel</Text>
      </Pressable>
      <Text style={[styles.title, { color: theme.textPrimary }]} numberOfLines={1}>
        {title}
      </Text>
      <Pressable onPress={onSave} style={[styles.side, styles.saveSide]} hitSlop={8}>
        <Text style={[styles.save, { color: saveEnabled ? theme.accentDeep : theme.textSecondary }]}>{saveLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  side: { minWidth: 60 },
  saveSide: { alignItems: 'flex-end' },
  cancel: { fontSize: 14, fontWeight: '600' },
  title: { flex: 1, textAlign: 'center', fontFamily: fontFamily.semibold, fontSize: 16, letterSpacing: -0.01 * 16 },
  save: { fontSize: 14, fontWeight: '600' },
});
