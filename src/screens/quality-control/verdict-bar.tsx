import { Pressable, StyleSheet, Text, View } from 'react-native';

import { fontFamily } from '@/theme';
import { useTheme } from '@/theme/theme-provider';

export interface VerdictBarProps {
  summary: string;
  defectSummary: string;
  label: string;
  background: string;
  foreground: string;
  onSubmit: () => void;
  onSave: () => void;
}

export function VerdictBar({ summary, defectSummary, label, background, foreground, onSubmit, onSave }: VerdictBarProps) {
  const theme = useTheme();

  return (
    <View style={[styles.wrap, { backgroundColor: theme.surface, borderTopColor: theme.border, boxShadow: theme.shadows.raised }]}>
      <View style={styles.summaryRow}>
        <Text style={[styles.summaryText, { color: theme.textPrimary }]} numberOfLines={1}>
          {summary}
        </Text>
        <Text style={[styles.defectText, { color: theme.textSecondary }]}>{defectSummary}</Text>
      </View>
      <View style={styles.buttonRow}>
        <Pressable onPress={onSubmit} style={[styles.verdictButton, { backgroundColor: background }]}>
          <Text style={[styles.verdictLabel, { color: foreground }]}>{label}</Text>
        </Pressable>
        <Pressable onPress={onSave} style={[styles.saveButton, { borderColor: theme.border, backgroundColor: theme.surface }]}>
          <Text style={[styles.saveLabel, { color: theme.textPrimary }]}>Save</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 16, gap: 10, borderTopWidth: StyleSheet.hairlineWidth },
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  summaryText: { flex: 1, fontSize: 13.5 },
  defectText: { fontFamily: fontFamily.mono, fontSize: 11 },
  buttonRow: { flexDirection: 'row', gap: 8 },
  verdictButton: { flex: 1, height: 54, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  verdictLabel: { fontSize: 16, fontWeight: '600' },
  saveButton: { width: 54, height: 54, borderRadius: 15, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  saveLabel: { fontFamily: fontFamily.mono, fontSize: 10, letterSpacing: 0.06 * 10, textTransform: 'uppercase' },
});
