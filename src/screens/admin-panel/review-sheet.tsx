import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { useTheme } from '@/theme/theme-provider';
import { fontFamily, radii, type Theme } from '@/theme';
import { LEVEL_LABEL } from '@/data/admin-panel/mock';
import type { AccessLevel, DiffRow, Role } from '@/data/admin-panel/types';

export interface ReviewSheetProps {
  visible: boolean;
  onClose: () => void;
  role: Role;
  diffs: DiffRow[];
  applying: boolean;
  onApply: () => void;
}

const OFF_SCREEN = 640;

function toPalette(theme: Theme, to: AccessLevel) {
  if (to === 0) return { bg: theme.dangerWash, fg: theme.dangerWashText };
  if (to === 2) return { bg: theme.accentWash, fg: theme.accentWashText };
  return { bg: theme.surfaceRaised, fg: theme.textSecondary };
}

/** Same richer-than-`BottomSheet` shape as `DirectorSheet` — a header with more than a plain title plus a pinned two-button footer below the scroll area. */
export function ReviewSheet({ visible, onClose, role, diffs, applying, onApply }: ReviewSheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(visible);
  const progress = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      progress.value = withTiming(1, { duration: 280, easing: Easing.out(Easing.cubic) });
    } else if (mounted) {
      progress.value = withTiming(0, { duration: 200, easing: Easing.in(Easing.cubic) }, (finished) => {
        if (finished) runOnJS(setMounted)(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: (1 - progress.value) * OFF_SCREEN }] }));

  if (!mounted) return null;

  const removals = diffs.filter((d) => d.to < d.from);
  const hasRemovals = removals.length > 0;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        <Animated.View style={[StyleSheet.absoluteFill, backdropStyle]}>
          <Pressable style={[StyleSheet.absoluteFill, styles.backdrop]} onPress={onClose} />
        </Animated.View>

        <Animated.View style={[sheetStyle, styles.sheet, { backgroundColor: theme.surfaceRaised, paddingBottom: insets.bottom, boxShadow: theme.shadows.sheet }]}>
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <View style={styles.headerText}>
              <Text style={[styles.title, { color: theme.textPrimary }]}>Review changes</Text>
              <Text style={[styles.meta, { color: theme.textSecondary }]}>
                {role.label} · {diffs.length === 1 ? '1 change' : `${diffs.length} changes`}
              </Text>
            </View>
            <Pressable onPress={onClose} style={[styles.closeButton, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Icon name="x" size={16} color={theme.textPrimary} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            <View style={[styles.diffCard, { backgroundColor: theme.surface }]}>
              {diffs.map((d, i) => {
                const to = toPalette(theme, d.to);
                return (
                  <View
                    key={d.id}
                    style={[styles.diffRow, i > 0 ? { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.border } : null]}
                  >
                    <View style={styles.diffText}>
                      <Text style={[styles.diffName, { color: theme.textPrimary }]} numberOfLines={1}>
                        {d.name}
                      </Text>
                      <Text style={[styles.diffGroup, { color: theme.textSecondary }]} numberOfLines={1}>
                        {d.group}
                      </Text>
                    </View>
                    <Text style={[styles.fromLabel, { color: theme.textSecondary }]}>{LEVEL_LABEL[d.from]}</Text>
                    <Text style={[styles.arrow, { color: theme.textSecondary }]}>→</Text>
                    <View style={[styles.toPill, { backgroundColor: to.bg }]}>
                      <Text style={[styles.toLabel, { color: to.fg }]}>{LEVEL_LABEL[d.to]}</Text>
                    </View>
                  </View>
                );
              })}
            </View>

            {hasRemovals ? (
              <View style={[styles.removalCard, { backgroundColor: theme.dangerWash }]}>
                <View style={[styles.removalDot, { backgroundColor: theme.dangerWashText }]} />
                <Text style={[styles.removalText, { color: theme.dangerWashText }]}>
                  {removals.length === 1 ? '1 section is' : `${removals.length} sections are`} being taken away from{' '}
                  {role.people} people. Anyone using it right now keeps access until they sign out.
                </Text>
              </View>
            ) : null}

            <View style={[styles.infoCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <InfoRow label="Affected people" value={`${role.people} people`} theme={theme} />
              <InfoRow label="Takes effect" value="next sign-in" theme={theme} />
              <InfoRow label="Logged as" value="sarita.lama" theme={theme} mono />
            </View>
          </ScrollView>

          <View style={[styles.footer, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
            <Button label="Keep editing" variant="secondary" onPress={onClose} style={styles.keepButton} />
            <Button
              label={`Apply to ${role.people} people`}
              variant="primary"
              loading={applying}
              onPress={onApply}
              style={styles.applyButton}
            />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

function InfoRow({ label, value, theme, mono }: { label: string; value: string; theme: Theme; mono?: boolean }) {
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>{label}</Text>
      <Text style={[mono ? styles.infoValueMono : styles.infoValue, { color: theme.textPrimary }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { backgroundColor: 'rgba(10,21,18,0.42)' },
  sheet: { borderTopLeftRadius: radii.xl + 4, borderTopRightRadius: radii.xl + 4, overflow: 'hidden', maxHeight: '86%' },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  headerText: { flex: 1, gap: 3, minWidth: 0 },
  title: { fontFamily: fontFamily.semibold, fontSize: 18, letterSpacing: -0.02 * 18 },
  meta: { fontFamily: fontFamily.mono, fontSize: 10, letterSpacing: 0.11 * 10, textTransform: 'uppercase' },
  closeButton: { width: 38, height: 38, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8, gap: 12 },
  diffCard: { borderRadius: radii.lg, overflow: 'hidden' },
  diffRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 13, paddingHorizontal: 15 },
  diffText: { flex: 1, gap: 3, minWidth: 0 },
  diffName: { fontFamily: fontFamily.semibold, fontSize: 14.5 },
  diffGroup: { fontFamily: fontFamily.mono, fontSize: 10.5 },
  fromLabel: { fontFamily: fontFamily.mono, fontSize: 10.5, textDecorationLine: 'line-through', flexShrink: 0 },
  arrow: { fontSize: 11, flexShrink: 0 },
  toPill: { height: 26, paddingHorizontal: 10, borderRadius: 999, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  toLabel: { fontFamily: fontFamily.mono, fontSize: 10, letterSpacing: 0.1 * 10, textTransform: 'uppercase' },
  removalCard: { borderRadius: radii.lg, padding: 14, flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  removalDot: { width: 7, height: 7, borderRadius: 99, marginTop: 6, flexShrink: 0 },
  removalText: { flex: 1, fontSize: 13, lineHeight: 13 * 1.5 },
  infoCard: { borderRadius: radii.lg, borderWidth: 1, padding: 14, gap: 9 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoLabel: { flex: 1, fontSize: 13 },
  infoValue: { fontSize: 13 },
  infoValueMono: { fontFamily: fontFamily.mono, fontSize: 12.5 },
  footer: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 20, flexDirection: 'row', gap: 9, borderTopWidth: StyleSheet.hairlineWidth },
  keepButton: { flex: 1 },
  applyButton: { flex: 1.25 },
});
