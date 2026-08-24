import { useEffect, useState, type ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/theme-provider';
import { fontFamily, radii } from '@/theme';

import { Icon } from './icon';

export interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxHeight?: number;
}

const OFF_SCREEN = 640;

/** Backdrop fade + sheet slide-up (`kazi-sheet`), driven manually so the exit animation plays before the Modal unmounts. */
export function BottomSheet({ visible, onClose, title, children, maxHeight = 660 }: BottomSheetProps) {
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
            { maxHeight, backgroundColor: theme.surfaceRaised, paddingBottom: insets.bottom, boxShadow: theme.shadows.sheet },
          ]}
        >
          <View style={[styles.header, { backgroundColor: theme.surfaceRaised, borderBottomColor: theme.border }]}>
            <View style={[styles.grabber, { backgroundColor: theme.border }]} />
            <View style={styles.headerRow}>
              <Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>
              <Pressable
                onPress={onClose}
                style={[styles.closeButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
              >
                <Icon name="x" size={16} color={theme.textPrimary} />
              </Pressable>
            </View>
          </View>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
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
    backgroundColor: 'rgba(10,21,18,0.42)',
  },
  sheet: {
    borderTopLeftRadius: radii.xl + 4,
    borderTopRightRadius: radii.xl + 4,
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  grabber: {
    width: 44,
    height: 5,
    borderRadius: 99,
    alignSelf: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: fontFamily.semibold,
    fontSize: 18,
    letterSpacing: -0.015 * 18,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 26,
    gap: 20,
  },
});
