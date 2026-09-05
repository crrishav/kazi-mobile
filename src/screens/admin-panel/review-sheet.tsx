import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { useTheme } from '@/theme/theme-provider';
import { fontFamily, radii, type Theme } from '@/theme';
import type { DiffRow } from '@/data/admin-panel/types';

export interface ReviewSheetProps {
  visible: boolean;
  onClose: () => void;
  roleLabel: string;
  holderCount: number;
  diffs: DiffRow[];
  applying: boolean;
  error: string | null;
  onApply: () => void;
}

const OFF_SCREEN = 640;

function toPalette(theme: Theme, diff: DiffRow) {
  if (diff.kind === 'super') return { bg: theme.warningWash, fg: theme.warningWashText };
  if (diff.removal) return { bg: theme.dangerWash, fg: theme.dangerWashText };
  if (diff.to === 'edit' || diff.to === 'on') return { bg: theme.accentWash, fg: theme.accentWashText };
  return { bg: theme.surfaceRaised, fg: theme.textSecondary };
}

/**
 * Nothing is live until this is applied.
 *
 * The same richer-than-`BottomSheet` shape as `DirectorSheet` — a header with
 * more than a plain title plus a pinned footer below the scroll area — because
 * the whole batch goes up together and the person needs to read it first.
 */
export function ReviewSheet({ visible, onClose, roleLabel, holderCount, diffs, applying, error, onApply }: ReviewSheetProps) {
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

  const removals = diffs.filter((d) => d.removal);
  const droppingSuper = diffs.some((d) => d.kind === 'super' && d.to === 'off');

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        <Animated.View style={[StyleSheet.absoluteFill, backdropStyle]}>
          <Pressable style={[StyleSheet.absoluteFill, styles.backdrop]} onPress={onClose} />
        </Animated.View>

        <Animated.View
          style={[
            sheetStyle,
            styles.sheet,
            { backgroundColor: theme.surfaceRaised, paddingBottom: insets.bottom, boxShadow: theme.shadows.sheet },
          ]}
        >
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <View style={styles.headerText}>
              <Text style={[styles.title, { color: theme.textPrimary }]}>Review changes</Text>
              <Text style={[styles.meta, { color: theme.textSecondary }]}>
                {roleLabel} · {diffs.length === 1 ? '1 change' : `${diffs.length} changes`}
                {holderCount > 0 ? ` · ${holderCount} ${holderCount === 1 ? 'person' : 'people'} affected` : ''}
              </Text>
            </View>
            <Pressable onPress={onClose} style={[styles.closeButton, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Icon name="x" size={16} color={theme.textPrimary} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            <View style={[styles.diffCard, { backgroundColor: theme.surface }]}>
              {diffs.map((d, i) => {
                const to = toPalette(theme, d);
                return (
                  <View
                    key={d.key}
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
                    <Text style={[styles.fromLabel, { color: theme.textSecondary }]}>{d.from}</Text>
                    <Text style={[styles.arrow, { color: theme.textSecondary }]}>→</Text>
                    <View style={[styles.toPill, { backgroundColor: to.bg }]}>
                      <Text style={[styles.toLabel, { color: to.fg }]}>{d.to}</Text>
                    </View>
                  </View>
                );
              })}
            </View>

            {droppingSuper ? (
              <View style={[styles.warnCard, { backgroundColor: theme.warningWash }]}>
                <Icon name="alert-triangle" size={15} color={theme.warningWashText} />
                <Text style={[styles.warnText, { color: theme.warningWashText }]}>
                  Dropping super admin keeps every page it was already given — those switches simply become editable
                  again. Its record scope drops to own records.
                </Text>
              </View>
            ) : removals.length > 0 ? (
              <View style={[styles.warnCard, { backgroundColor: theme.dangerWash }]}>
                <Icon name="alert-triangle" size={15} color={theme.dangerWashText} />
                <Text style={[styles.warnText, { color: theme.dangerWashText }]}>
                  {removals.length === 1 ? '1 change takes access away' : `${removals.length} changes take access away`}.
                  Anyone holding this role loses it on their next request.
                </Text>
              </View>
            ) : null}

            {error ? (
              <View style={[styles.warnCard, { backgroundColor: theme.dangerWash }]}>
                <Icon name="alert-circle" size={15} color={theme.dangerWashText} />
                <Text style={[styles.warnText, { color: theme.dangerWashText }]}>
                  Couldn&apos;t save. {error}
                </Text>
              </View>
            ) : null}

            <Text style={[styles.note, { color: theme.textSecondary }]}>
              Applies to the role, not to one person — everyone holding it moves together.
            </Text>
          </ScrollView>

          <View style={[styles.footer, { borderTopColor: theme.border }]}>
            <View style={styles.footerButton}>
              <Button label="Back" variant="secondary" onPress={onClose} />
            </View>
            <View style={styles.footerButton}>
              <Button label={applying ? 'Saving…' : 'Save changes'} variant="primary" loading={applying} onPress={onApply} />
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { backgroundColor: 'rgba(12,20,17,0.42)' },
  sheet: {
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    maxHeight: '82%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerText: { flex: 1, gap: 3, minWidth: 0 },
  title: { fontFamily: fontFamily.semibold, fontSize: 17, letterSpacing: -0.01 * 17 },
  meta: { fontFamily: fontFamily.mono, fontSize: 10.5 },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { padding: 20, gap: 12 },
  diffCard: { borderRadius: radii.lg, overflow: 'hidden' },
  diffRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 11, paddingHorizontal: 13 },
  diffText: { flex: 1, gap: 2, minWidth: 0 },
  diffName: { fontFamily: fontFamily.semibold, fontSize: 13.5 },
  diffGroup: { fontFamily: fontFamily.mono, fontSize: 10 },
  fromLabel: { fontFamily: fontFamily.mono, fontSize: 10.5, textDecorationLine: 'line-through' },
  arrow: { fontFamily: fontFamily.mono, fontSize: 11 },
  toPill: { height: 22, paddingHorizontal: 9, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  toLabel: { fontFamily: fontFamily.mono, fontSize: 10 },
  warnCard: { flexDirection: 'row', gap: 9, borderRadius: radii.md, padding: 13 },
  warnText: { flex: 1, fontFamily: fontFamily.regular, fontSize: 12.5, lineHeight: 12.5 * 1.5 },
  note: { fontFamily: fontFamily.mono, fontSize: 10.5, lineHeight: 10.5 * 1.6, paddingHorizontal: 2 },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerButton: { flex: 1 },
});
