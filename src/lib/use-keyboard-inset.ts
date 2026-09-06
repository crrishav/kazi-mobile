import { useEffect, useRef } from 'react';
import { Keyboard, Platform } from 'react-native';
import { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

/**
 * How much room the keyboard is taking, as an animated bottom padding.
 *
 * `KeyboardAvoidingView` is the obvious answer and it does not work here.
 * Android has been edge-to-edge since SDK 54 and cannot be opted out of, and
 * an edge-to-edge window is not resized when the keyboard opens — so
 * `adjustResize` changes nothing, the view keeps its full height, and a
 * bottom-pinned composer stays exactly where it was: underneath the keyboard.
 * iOS never resizes the window either; `KeyboardAvoidingView` only papers over
 * that with `behavior="padding"`, and only when the view happens to reach the
 * bottom of the screen, which it does not while a tab bar is mounted.
 *
 * The keyboard *events* are reliable on both platforms, so this measures
 * instead of guessing. iOS gets `keyboardWillShow`, which fires with the
 * system's own duration before the keyboard moves, so the composer rides up
 * with it; Android only has `keyboardDidShow`, so it gets a short timing of
 * its own rather than snapping.
 *
 * `safeBottom` is subtracted because the view is usually already padding for
 * the home indicator — an open keyboard covers that area, so paying for it
 * twice leaves a visible gap between the input and the keys.
 *
 * `onOpen` fires as the keyboard appears. Shrinking the view keeps the scroll
 * offset where it was, which quietly hides the newest messages behind the
 * composer — a list that wants to stay pinned to the bottom uses this to
 * follow.
 */
export function useKeyboardInset(safeBottom = 0, onOpen?: () => void) {
  const inset = useSharedValue(0);
  // Kept in a ref so a caller can pass an inline arrow without re-subscribing
  // the listeners on every render. Written from an effect, not during render.
  const onOpenRef = useRef(onOpen);
  useEffect(() => {
    onOpenRef.current = onOpen;
  }, [onOpen]);

  useEffect(() => {
    const ios = Platform.OS === 'ios';

    const show = Keyboard.addListener(ios ? 'keyboardWillShow' : 'keyboardDidShow', (event) => {
      const height = Math.max(0, event.endCoordinates.height - safeBottom);
      inset.value = withTiming(height, {
        duration: event.duration || (ios ? 250 : 180),
        easing: Easing.out(Easing.quad),
      });
      onOpenRef.current?.();
    });

    const hide = Keyboard.addListener(ios ? 'keyboardWillHide' : 'keyboardDidHide', (event) => {
      inset.value = withTiming(0, {
        duration: event?.duration || (ios ? 250 : 180),
        easing: Easing.out(Easing.quad),
      });
    });

    return () => {
      show.remove();
      hide.remove();
    };
  }, [inset, safeBottom]);

  return useAnimatedStyle(() => ({ paddingBottom: inset.value }));
}
