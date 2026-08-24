import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { useTheme } from '@/theme/theme-provider';
import { fontFamily, tabularNums, type Theme } from '@/theme';
import type { CheckVerdict, QcPoint } from '@/data/quality-control/types';

export interface ChecklistPointProps {
  point: QcPoint;
  index: number;
  verdict: CheckVerdict | undefined;
  defects: number;
  onSetVerdict: (v: CheckVerdict) => void;
  onBumpDefects: (delta: number) => void;
}

function tone(theme: Theme, kind: CheckVerdict, active: boolean) {
  if (!active) return { bg: theme.surface, fg: theme.textPrimary, border: theme.border };
  const map = {
    pass: { bg: theme.accentWash, fg: theme.accentWashText, border: theme.accent },
    flag: { bg: theme.warningWash, fg: theme.warningWashText, border: theme.warning },
    fail: { bg: theme.dangerWash, fg: theme.dangerWashText, border: theme.danger },
  };
  return map[kind];
}

export function ChecklistPoint({ point, index, verdict, defects, onSetVerdict, onBumpDefects }: ChecklistPointProps) {
  const theme = useTheme();
  const accent = verdict === 'pass' ? theme.accent : verdict === 'flag' ? theme.warning : verdict === 'fail' ? theme.danger : theme.draftWash;
  const pass = tone(theme, 'pass', verdict === 'pass');
  const flag = tone(theme, 'flag', verdict === 'flag');
  const fail = tone(theme, 'fail', verdict === 'fail');

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, boxShadow: theme.shadows.card, borderLeftColor: accent }]}>
      <View style={styles.headerRow}>
        <View style={styles.textWrap}>
          <Text style={[styles.label, { color: theme.textPrimary }]}>{point.label}</Text>
          <Text style={[styles.spec, { color: theme.textSecondary }]}>{point.spec}</Text>
        </View>
        <Text style={[styles.index, tabularNums, { color: theme.textSecondary }]}>{String(index + 1).padStart(2, '0')}</Text>
      </View>

      <View style={styles.buttonRow}>
        <Pressable onPress={() => onSetVerdict('pass')} style={[styles.button, { backgroundColor: pass.bg, borderColor: pass.border }]}>
          <Text style={[styles.buttonLabel, { color: pass.fg }]}>Pass</Text>
        </Pressable>
        <Pressable onPress={() => onSetVerdict('flag')} style={[styles.button, { backgroundColor: flag.bg, borderColor: flag.border }]}>
          <Text style={[styles.buttonLabel, { color: flag.fg }]}>Flag</Text>
        </Pressable>
        <Pressable onPress={() => onSetVerdict('fail')} style={[styles.button, { backgroundColor: fail.bg, borderColor: fail.border }]}>
          <Text style={[styles.buttonLabel, { color: fail.fg }]}>Fail</Text>
        </Pressable>
      </View>

      {verdict === 'fail' ? (
        <View style={[styles.defectRow, { backgroundColor: theme.surfaceRaised }]}>
          <Text style={[styles.defectLabel, { color: theme.textPrimary }]}>Defects found</Text>
          <View style={styles.stepper}>
            <Pressable onPress={() => onBumpDefects(-1)} style={[styles.stepperButton, { borderColor: theme.border, backgroundColor: theme.surface }]}>
              <Icon name="minus" size={16} color={theme.textPrimary} />
            </Pressable>
            <Text style={[styles.defectCount, tabularNums, { color: theme.textPrimary }]}>{defects}</Text>
            <Pressable onPress={() => onBumpDefects(1)} style={[styles.stepperButton, { borderColor: theme.border, backgroundColor: theme.surface }]}>
              <Icon name="plus" size={16} color={theme.textPrimary} />
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 18, padding: 14, gap: 11, borderLeftWidth: 4 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  textWrap: { flex: 1, gap: 3, minWidth: 0 },
  label: { fontSize: 15, fontWeight: '600', lineHeight: 15 * 1.25 },
  spec: { fontFamily: fontFamily.mono, fontSize: 11 },
  index: { fontFamily: fontFamily.mono, fontSize: 10, letterSpacing: 0.1 * 10, textTransform: 'uppercase', paddingTop: 3 },
  buttonRow: { flexDirection: 'row', gap: 7 },
  button: { flex: 1, height: 44, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  buttonLabel: { fontFamily: fontFamily.semibold, fontSize: 13.5 },
  defectRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderRadius: 12, paddingVertical: 9, paddingRight: 10, paddingLeft: 13 },
  defectLabel: { fontSize: 13.5 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepperButton: { width: 38, height: 38, borderRadius: 11, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  defectCount: { minWidth: 26, textAlign: 'center', fontSize: 16, fontWeight: '600' },
});
