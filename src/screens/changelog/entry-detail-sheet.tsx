import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { useTheme } from '@/theme/theme-provider';
import { fontFamily, radii, type Theme } from '@/theme';
import { typePalette } from '@/data/changelog/utils';
import type { FlatEntry } from '@/data/changelog/types';

export interface EntryDetailSheetProps {
  entry: FlatEntry | null;
  onClose: () => void;
  onOpenScreen: (screen: string) => void;
}

const OFF_SCREEN = 640;

/** Same richer-than-`BottomSheet` shape as `ReviewSheet`/`DirectorSheet` — a header with more than a plain title plus a pinned two-button footer below the scroll area. */
export function EntryDetailSheet({ entry, onClose, onOpenScreen }: EntryDetailSheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(!!entry);
  const progress = useSharedValue(0);

  useEffect(() => {
    if (entry) {
      setMounted(true);
      progress.value = withTiming(1, { duration: 280, easing: Easing.out(Easing.cubic) });
    } else if (mounted) {
      progress.value = withTiming(0, { duration: 200, easing: Easing.in(Easing.cubic) }, (finished) => {
        if (finished) runOnJS(setMounted)(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: (1 - progress.value) * OFF_SCREEN }] }));

  if (!mounted || !entry) return null;

  const palette = typePalette(theme, entry.type);

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        <Animated.View style={[StyleSheet.absoluteFill, backdropStyle]}>
          <Pressable style={[StyleSheet.absoluteFill, styles.backdrop]} onPress={onClose} />
        </Animated.View>

        <Animated.View style={[sheetStyle, styles.sheet, { backgroundColor: theme.surfaceRaised, paddingBottom: insets.bottom, boxShadow: theme.shadows.sheet }]}>
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <View style={styles.headerText}>
              <View style={styles.headerTop}>
                <View style={[styles.tag, { backgroundColor: palette.bg }]}>
                  <Text style={[styles.tagLabel, { color: palette.fg }]}>{entry.type}</Text>
                </View>
                <Text style={[styles.headerDate, { color: theme.textSecondary }]}>{entry.date} 2026</Text>
              </View>
              <Text style={[styles.title, { color: theme.textPrimary }]}>{entry.title}</Text>
            </View>
            <Pressable onPress={onClose} style={[styles.closeButton, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Icon name="x" size={16} color={theme.textPrimary} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            <View style={[styles.bodyCard, { backgroundColor: theme.surface }]}>
              <Text style={[styles.bodyText, { color: theme.textPrimary }]}>{entry.body}</Text>
              {entry.impact ? (
                <View style={[styles.impactCard, { backgroundColor: theme.surfaceRaised }]}>
                  <View style={[styles.impactDot, { backgroundColor: palette.fg }]} />
                  <Text style={[styles.impactText, { color: theme.textPrimary }]}>{entry.impact}</Text>
                </View>
              ) : null}
            </View>

            <View style={[styles.infoCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <InfoRow label="Release" value={entry.release.version} theme={theme} />
              <InfoRow label="Area" value={entry.area} theme={theme} />
              <InfoRow label="Build" value={entry.build} theme={theme} mono />
              <InfoRow label="Shipped by" value={entry.who} theme={theme} />
            </View>
          </ScrollView>

          <View style={[styles.footer, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
            <Button label="Close" variant="secondary" onPress={onClose} style={styles.closeFooterButton} />
            <Button label={`Open ${entry.screen}`} variant="primary" onPress={() => onOpenScreen(entry.screen)} style={styles.openButton} />
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
      <Text style={[mono ? styles.infoValueMono : styles.infoValue, { color: theme.textPrimary }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { backgroundColor: 'rgba(10,21,18,0.42)' },
  sheet: { borderTopLeftRadius: radii.xl + 4, borderTopRightRadius: radii.xl + 4, overflow: 'hidden', maxHeight: '86%' },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  headerText: { flex: 1, gap: 7, minWidth: 0 },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tag: { height: 22, paddingHorizontal: 9, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  tagLabel: { fontFamily: fontFamily.mono, fontSize: 9.5, letterSpacing: 0.11 * 9.5, textTransform: 'uppercase' },
  headerDate: { fontFamily: fontFamily.mono, fontSize: 10.5 },
  title: { fontFamily: fontFamily.semibold, fontSize: 18, letterSpacing: -0.02 * 18, lineHeight: 18 * 1.25 },
  closeButton: { width: 38, height: 38, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8, gap: 12 },
  bodyCard: { borderRadius: radii.lg, padding: 16, gap: 9, boxShadow: '0 1px 2px rgba(15,36,29,0.04)' },
  bodyText: { fontSize: 13.5, lineHeight: 13.5 * 1.55 },
  impactCard: { flexDirection: 'row', gap: 9, alignItems: 'flex-start', borderRadius: 12, padding: 11 },
  impactDot: { width: 6, height: 6, borderRadius: 99, marginTop: 6, flexShrink: 0 },
  impactText: { flex: 1, fontSize: 12.5, lineHeight: 12.5 * 1.5 },
  infoCard: { borderRadius: radii.lg, borderWidth: 1, padding: 14, gap: 9 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoLabel: { flex: 1, fontSize: 13 },
  infoValue: { fontSize: 13 },
  infoValueMono: { fontFamily: fontFamily.mono, fontSize: 12.5 },
  footer: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 20, flexDirection: 'row', gap: 9, borderTopWidth: StyleSheet.hairlineWidth },
  closeFooterButton: { flex: 1 },
  openButton: { flex: 1.25 },
});
