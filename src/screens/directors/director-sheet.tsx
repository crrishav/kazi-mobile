import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { useTheme } from '@/theme/theme-provider';
import { fontFamily, radii } from '@/theme';
import { officeHours } from '@/data/directors/utils';
import type { Director } from '@/data/directors/types';

export interface DirectorSheetProps {
  visible: boolean;
  director: Director | null;
  onClose: () => void;
  onCopyEmail: () => void;
  onMessage: () => void;
}

const OFF_SCREEN = 640;

/** Bottom-sheet-shaped (rounded top, slide-up, backdrop) but with a richer avatar+name header and a pinned action footer — the generic `BottomSheet` header is plain-title-only, so this mirrors its animation rather than reusing it, same reasoning as Billing/Customers' own full-screen takeovers. */
export function DirectorSheet({ visible, director, onClose, onCopyEmail, onMessage }: DirectorSheetProps) {
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

  if (!mounted || !director) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        <Animated.View style={[StyleSheet.absoluteFill, backdropStyle]}>
          <Pressable style={[StyleSheet.absoluteFill, styles.backdrop]} onPress={onClose} />
        </Animated.View>

        <Animated.View style={[sheetStyle, styles.sheet, { backgroundColor: theme.surfaceRaised, paddingBottom: insets.bottom, boxShadow: theme.shadows.sheet }]}>
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <Avatar initials={director.avatarInitials} tint={director.avatarTint} size="md" />
            <View style={styles.headerTextWrap}>
              <Text style={[styles.name, { color: theme.textPrimary }]} numberOfLines={1}>
                {director.name}
              </Text>
              <Text style={[styles.meta, { color: theme.textSecondary }]} numberOfLines={1}>
                {director.role} · {director.office}
              </Text>
            </View>
            <Pressable onPress={onClose} style={[styles.closeButton, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Icon name="x" size={16} color={theme.textPrimary} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            <Text style={[styles.bio, { color: theme.textPrimary }]}>{director.bio}</Text>

            <View style={[styles.remitCard, { backgroundColor: theme.surface }]}>
              <Text style={[styles.remitEyebrow, { color: theme.textSecondary }]}>Remit</Text>
              <View style={styles.remitChipsRow}>
                {director.remit.map((r) => (
                  <View key={r} style={[styles.remitChip, { backgroundColor: theme.accentWash }]}>
                    <Text style={[styles.remitChipLabel, { color: theme.accentWashText }]}>{r}</Text>
                  </View>
                ))}
              </View>
              <View style={[styles.divider, { backgroundColor: theme.draftWash }]} />
              <View style={styles.detailRows}>
                <DetailRow label="Office" value={director.office} theme={theme} />
                <DetailRow label="With Kazi" value={director.tenure} theme={theme} mono />
                <DetailRow label="Working hours" value={officeHours(director.office)} theme={theme} mono />
                <DetailRow label="Email" value={director.email} theme={theme} mono valueColor={theme.link} />
              </View>
            </View>
          </ScrollView>

          <View style={[styles.footer, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
            <Button label="Copy email" variant="secondary" onPress={onCopyEmail} style={styles.footerButton} />
            <Button label="Message" variant="primary" onPress={onMessage} style={styles.footerButton} />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

function DetailRow({ label, value, theme, mono, valueColor }: { label: string; value: string; theme: ReturnType<typeof useTheme>; mono?: boolean; valueColor?: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>{label}</Text>
      <Text style={[mono ? styles.detailValueMono : styles.detailValue, { color: valueColor ?? theme.textPrimary }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { backgroundColor: 'rgba(10,21,18,0.42)' },
  sheet: { borderTopLeftRadius: radii.xl + 4, borderTopRightRadius: radii.xl + 4, overflow: 'hidden', maxHeight: 660 },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  headerTextWrap: { flex: 1, gap: 3, minWidth: 0 },
  name: { fontFamily: fontFamily.semibold, fontSize: 18, letterSpacing: -0.02 * 18 },
  meta: { fontFamily: fontFamily.mono, fontSize: 10, letterSpacing: 0.11 * 10, textTransform: 'uppercase' },
  closeButton: { width: 38, height: 38, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8, gap: 14 },
  bio: { fontSize: 14, lineHeight: 14 * 1.6 },
  remitCard: { borderRadius: 18, padding: 16, gap: 12 },
  remitEyebrow: { fontFamily: fontFamily.mono, fontSize: 10, letterSpacing: 0.11 * 10, textTransform: 'uppercase' },
  remitChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  remitChip: { height: 28, paddingHorizontal: 11, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  remitChipLabel: { fontSize: 12, fontWeight: '600' },
  divider: { height: 1 },
  detailRows: { gap: 9 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  detailLabel: { flex: 1, fontSize: 13 },
  detailValue: { fontSize: 13.5, fontWeight: '600' },
  detailValueMono: { fontFamily: fontFamily.mono, fontSize: 12.5 },
  footer: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 20, flexDirection: 'row', gap: 9, borderTopWidth: StyleSheet.hairlineWidth },
  footerButton: { flex: 1 },
});
