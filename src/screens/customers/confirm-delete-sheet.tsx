import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { useTheme } from '@/theme/theme-provider';
import { fontFamily } from '@/theme';

export interface ConfirmDeleteSheetProps {
  visible: boolean;
  name: string;
  warning: string;
  onCancel: () => void;
  onConfirm: () => void;
}

/** Compact confirm card, distinct from `BottomSheet` — margin on all sides, fully rounded, fade + small rise rather than a full slide-up. */
export function ConfirmDeleteSheet({ visible, name, warning, onCancel, onConfirm }: ConfirmDeleteSheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(visible);
  const progress = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      progress.value = withTiming(1, { duration: 220, easing: Easing.out(Easing.cubic) });
    } else if (mounted) {
      progress.value = withTiming(0, { duration: 160, easing: Easing.in(Easing.cubic) }, (finished) => {
        if (finished) runOnJS(setMounted)(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  const cardStyle = useAnimatedStyle(() => ({ opacity: progress.value, transform: [{ translateY: (1 - progress.value) * 22 }] }));

  if (!mounted) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onCancel} statusBarTranslucent>
      <View style={[styles.root, { padding: 16, paddingBottom: Math.max(16, insets.bottom) }]}>
        <Animated.View style={[StyleSheet.absoluteFill, backdropStyle]}>
          <Pressable style={[StyleSheet.absoluteFill, styles.backdrop]} onPress={onCancel} />
        </Animated.View>

        <Animated.View style={[cardStyle, styles.card, { backgroundColor: theme.surface, boxShadow: theme.shadows.floating }]}>
          <View style={styles.textWrap}>
            <Text style={[styles.title, { color: theme.textPrimary }]}>Delete {name}?</Text>
            <Text style={[styles.warning, { color: theme.textSecondary }]}>{warning}</Text>
          </View>
          <View style={styles.buttonRow}>
            <Button label="Keep" variant="secondary" onPress={onCancel} style={styles.flex1} />
            <Button label="Delete" variant="danger" onPress={onConfirm} style={styles.flex1} />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    backgroundColor: 'rgba(13,31,25,0.42)',
  },
  card: {
    borderRadius: 22,
    padding: 20,
    gap: 14,
  },
  textWrap: { gap: 6 },
  title: { fontFamily: fontFamily.semibold, fontSize: 18, letterSpacing: -0.02 * 18 },
  warning: { fontSize: 13.5, lineHeight: 13.5 * 1.5 },
  buttonRow: { flexDirection: 'row', gap: 10 },
  flex1: { flex: 1 },
});
