import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SegmentedProportionBar } from '@/components/ui/segmented-proportion-bar';
import { useTheme } from '@/theme/theme-provider';
import { fontFamily } from '@/theme';
import { PEOPLE, STAGES, stageRampDark, stageRampLight } from '@/data/production/mock';
import type { Batch } from '@/data/production/types';
import { segmentColors, stageIndexOf } from '@/data/production/utils';

import { DetailActivity } from './detail-activity';

export interface DetailViewProps {
  batch: Batch;
  noteDraft: string;
  onNoteDraft: (text: string) => void;
  onAddNote: () => void;
  onAddPhoto: () => void;
  onLogOutput: () => void;
  onAdvance: () => void;
  onCancel: () => void;
}

export function DetailView({ batch, noteDraft, onNoteDraft, onAddNote, onAddPhoto, onLogOutput, onAdvance, onCancel }: DetailViewProps) {
  const theme = useTheme();
  const output = batch.output;
  const passRate = output && output.passed + output.failed > 0 ? Math.round((output.passed / (output.passed + output.failed)) * 100) : null;
  const ramp = theme.scheme === 'dark' ? stageRampDark : stageRampLight;
  const stageIndex = stageIndexOf(batch);
  const canAdvance = batch.status !== 'cancelled' && stageIndex < STAGES.length - 1;
  const canCancel = batch.status !== 'cancelled' && batch.status !== 'done';
  const trackerSegments = segmentColors(batch, ramp, 'rgba(233,241,236,0.16)', 'rgba(224,138,99,0.3)').map((color) => ({ weight: 1, color }));

  return (
    <Animated.View entering={FadeInUp.duration(220)} style={styles.wrap}>
      <Card elevation="inverted" style={styles.trackerCard}>
        <View style={styles.trackerRow}>
          <View style={styles.gap5}>
            <Text style={[styles.eyebrow, { color: theme.onDark.textMuted }]}>Now at</Text>
            <Text style={[styles.trackerValue, { color: theme.onDark.text }]}>{STAGES[stageIndex]?.label ?? '—'}</Text>
          </View>
          <View style={[styles.gap5, styles.alignEnd]}>
            <Text style={[styles.eyebrow, { color: theme.onDark.textMuted }]}>Progress</Text>
            <Text style={[styles.trackerValue, { color: theme.onDark.accent }]}>{stageIndex + 1} / {STAGES.length}</Text>
          </View>
        </View>
        <SegmentedProportionBar segments={trackerSegments} height={6} />
      </Card>

      <Card elevation="raised" style={styles.stageCard}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary, paddingBottom: 10 }]}>Stage tracker</Text>
        {STAGES.map((s, idx) => {
          const done = idx < stageIndex;
          const current = idx === stageIndex;
          return (
            <View key={s.key} style={styles.stageRow}>
              <View style={styles.stageMarkCol}>
                <View
                  style={[
                    styles.stageMark,
                    {
                      backgroundColor: done ? theme.accent : theme.surface,
                      borderWidth: current ? 2 : done ? 0 : 1.5,
                      borderColor: current ? theme.accent : theme.border,
                    },
                  ]}
                >
                  <View style={[styles.stageMarkInner, { backgroundColor: done ? theme.surfaceInverted : current ? theme.accent : theme.border }]} />
                </View>
                {idx < STAGES.length - 1 ? (
                  <View style={[styles.stageLine, { backgroundColor: idx < stageIndex ? theme.accent : theme.background }]} />
                ) : null}
              </View>
              <View style={styles.stageTextRow}>
                <View style={styles.gap3}>
                  <Text style={[styles.stageLabel, { color: done || current ? theme.textPrimary : theme.textSecondary, fontFamily: current ? fontFamily.semibold : fontFamily.medium }]}>
                    {s.label}
                  </Text>
                  <Text style={[styles.stageMeta, { color: theme.textSecondary }]}>
                    {done ? `Completed · ${idx < 2 ? '22 Aug' : '25 Aug'}` : current ? `Started 08:15 · ${(PEOPLE.find((p) => p.id === batch.person) ?? PEOPLE[0]).name}` : 'Not started'}
                  </Text>
                </View>
                {current ? (
                  <View style={[styles.currentChip, { backgroundColor: theme.accentWash }]}>
                    <Text style={[styles.currentChipText, { color: theme.accentWashText }]}>In progress</Text>
                  </View>
                ) : null}
              </View>
            </View>
          );
        })}
      </Card>

      <Card elevation="raised" style={styles.outputCard}>
        <View style={styles.outputHeader}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Output &amp; QC</Text>
          <Button label={output ? 'Update' : 'Log output'} size="small" variant="secondary" onPress={onLogOutput} />
        </View>
        {output ? (
          <>
            <View style={styles.outputStatsRow}>
              <OutputStat label="Checked" value={output.checked.toLocaleString()} theme={theme} />
              <OutputStat label="Passed" value={output.passed.toLocaleString()} theme={theme} tone={theme.accentWashText} />
              <OutputStat label="Failed" value={output.failed.toLocaleString()} theme={theme} tone={output.failed > 0 ? theme.dangerWashText : undefined} />
            </View>
            <View style={[styles.rateTrack, { backgroundColor: theme.background }]}>
              <View style={[styles.rateFill, { width: `${passRate ?? 0}%`, backgroundColor: (passRate ?? 0) >= 95 ? theme.accent : (passRate ?? 0) >= 85 ? theme.warning : theme.danger }]} />
            </View>
            <Text style={[styles.rateLabel, { color: theme.textSecondary }]}>{passRate}% pass rate · feeds QC and the dashboard</Text>
          </>
        ) : (
          <Text style={[styles.outputEmpty, { color: theme.textSecondary }]}>No inspected output logged yet.</Text>
        )}
      </Card>

      <DetailActivity batch={batch} noteDraft={noteDraft} onNoteDraft={onNoteDraft} onAddNote={onAddNote} onAddPhoto={onAddPhoto} />

      <View style={styles.actions}>
        {canAdvance ? (
          <Button
            label={stageIndex < STAGES.length - 1 ? `Advance to ${STAGES[stageIndex + 1].label}` : 'Delivered'}
            onPress={onAdvance}
            fullWidth
            style={styles.tallButton}
          />
        ) : null}
        {canCancel ? <Button label="Cancel batch" variant="dangerOutline" onPress={onCancel} fullWidth /> : null}
      </View>
    </Animated.View>
  );
}

function OutputStat({ label, value, theme, tone }: { label: string; value: string; theme: ReturnType<typeof useTheme>; tone?: string }) {
  return (
    <View style={styles.outputStat}>
      <Text style={[styles.outputStatLabel, { color: theme.textSecondary }]}>{label}</Text>
      <Text style={[styles.outputStatValue, { color: tone ?? theme.textPrimary }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 14 },
  outputCard: { padding: 18, gap: 12 },
  outputHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  outputStatsRow: { flexDirection: 'row', gap: 12 },
  outputStat: { flex: 1, gap: 3 },
  outputStatLabel: { fontFamily: fontFamily.mono, fontSize: 9.5, letterSpacing: 0.1 * 9.5, textTransform: 'uppercase' },
  outputStatValue: { fontFamily: fontFamily.semibold, fontSize: 18 },
  rateTrack: { height: 6, borderRadius: 99, overflow: 'hidden' },
  rateFill: { height: '100%', borderRadius: 99 },
  rateLabel: { fontFamily: fontFamily.mono, fontSize: 10.5 },
  outputEmpty: { fontSize: 12.5, lineHeight: 12.5 * 1.5 },
  trackerCard: { padding: 18, gap: 16 },
  trackerRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 },
  gap5: { gap: 5 },
  gap3: { gap: 3 },
  alignEnd: { alignItems: 'flex-end' },
  eyebrow: { fontFamily: fontFamily.mono, fontSize: 10, letterSpacing: 0.12 * 10, textTransform: 'uppercase' },
  trackerValue: { fontFamily: fontFamily.semibold, fontSize: 22, letterSpacing: -0.02 * 22, lineHeight: 22 * 1.1 },
  stageCard: { padding: 18 },
  sectionTitle: { fontFamily: fontFamily.semibold, fontSize: 15 },
  stageRow: { flexDirection: 'row', gap: 12, alignItems: 'stretch' },
  stageMarkCol: { width: 22, alignItems: 'center' },
  stageMark: { width: 18, height: 18, borderRadius: 99, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  stageMarkInner: { width: 6, height: 6, borderRadius: 99 },
  stageLine: { flex: 1, width: 2, minHeight: 14 },
  stageTextRow: { flex: 1, paddingBottom: 16, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, minWidth: 0 },
  stageLabel: { fontSize: 14.5 },
  stageMeta: { fontFamily: fontFamily.mono, fontSize: 11 },
  currentChip: { height: 24, paddingHorizontal: 9, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  currentChipText: { fontSize: 11.5, fontWeight: '600' },
  actions: { gap: 10 },
  tallButton: { height: 54 },
});
