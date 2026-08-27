import { StyleSheet, Text, TextInput, View } from 'react-native';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/theme/theme-provider';
import { fontFamily, radii, tabularNums } from '@/theme';
import type { Batch, BatchOutputDraft } from '@/data/production/types';

export interface OutputSheetProps {
  visible: boolean;
  batch: Batch | null;
  draft: BatchOutputDraft;
  onClose: () => void;
  onChange: (patch: Partial<BatchOutputDraft>) => void;
  onSubmit: () => void;
}

const toNum = (s: string) => parseInt(s.replace(/[^0-9]/g, ''), 10) || 0;

/** Log inspected output for a batch (item 23) — checked / passed, failed auto-fills. */
export function OutputSheet({ visible, batch, draft, onClose, onChange, onSubmit }: OutputSheetProps) {
  const theme = useTheme();
  const checked = toNum(draft.checked);
  const passed = toNum(draft.passed);
  const failed = draft.failed.trim() !== '' ? toNum(draft.failed) : Math.max(0, checked - passed);
  const passRate = passed + failed > 0 ? Math.round((passed / (passed + failed)) * 100) : 0;
  const ready = checked > 0 && passed + failed <= checked && passed >= 0;

  const field = (label: string, key: keyof BatchOutputDraft, value: string, placeholder: string) => (
    <View style={styles.fieldCol}>
      <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
      <View style={[styles.inputBox, { borderColor: theme.border, backgroundColor: theme.surface }]}>
        <TextInput
          value={value}
          onChangeText={(v) => onChange({ [key]: v })}
          placeholder={placeholder}
          keyboardType="numeric"
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { color: theme.textPrimary }]}
        />
      </View>
    </View>
  );

  return (
    <BottomSheet visible={visible} onClose={onClose} title={batch ? `Log output · ${batch.code}` : 'Log output'} maxHeight={520}>
      {batch ? <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{batch.product} · target {batch.qty}</Text> : null}

      <View style={styles.row}>
        {field('Checked', 'checked', draft.checked, '0')}
        {field('Passed', 'passed', draft.passed, '0')}
        {field('Failed', 'failed', draft.failed, String(Math.max(0, checked - passed)))}
      </View>

      <View style={[styles.previewCard, { backgroundColor: theme.surfaceRaised, borderColor: theme.border }]}>
        <Text style={[styles.previewLabel, { color: theme.textSecondary }]}>QC pass rate</Text>
        <Text style={[styles.previewValue, tabularNums, { color: passRate >= 95 ? theme.accentWashText : passRate >= 85 ? theme.warningWashText : theme.dangerWashText }]}>
          {passRate}%
        </Text>
        <Text style={[styles.previewMeta, tabularNums, { color: theme.textSecondary }]}>
          {passed.toLocaleString()} passed · {failed.toLocaleString()} failed of {checked.toLocaleString()} checked
        </Text>
      </View>

      <Button label={ready ? 'Save output' : 'Enter checked & passed counts'} onPress={onSubmit} disabled={!ready} fullWidth style={styles.save} />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  subtitle: { fontFamily: fontFamily.mono, fontSize: 10, letterSpacing: 0.11 * 10, textTransform: 'uppercase', marginTop: -12 },
  row: { flexDirection: 'row', gap: 10 },
  fieldCol: { flex: 1, gap: 6 },
  label: { fontFamily: fontFamily.mono, fontSize: 10, letterSpacing: 0.11 * 10, textTransform: 'uppercase' },
  inputBox: { height: 54, paddingHorizontal: 14, borderRadius: radii.lg - 4, borderWidth: 1, justifyContent: 'center' },
  input: { fontSize: 20, fontWeight: '600', padding: 0 },
  previewCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 3 },
  previewLabel: { fontFamily: fontFamily.mono, fontSize: 10, letterSpacing: 0.1 * 10, textTransform: 'uppercase' },
  previewValue: { fontFamily: fontFamily.semibold, fontSize: 26, letterSpacing: -0.02 * 26 },
  previewMeta: { fontFamily: fontFamily.mono, fontSize: 10.5 },
  save: { height: 52 },
});
