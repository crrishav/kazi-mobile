/**
 * How a tab scene enters and leaves.
 *
 * The navigator ships two presets: `fade` (opacity only) and `shift` (opacity
 * plus a 50px horizontal slide). Neither is used here — `fade` alone is flat,
 * and `shift` both overshoots the design's motion vocabulary and has a standing
 * blank-screen bug (expo/expo#39514).
 *
 * This is the `kazi-rise` keyframe instead: the incoming scene fades up from a
 * few pixels below while the outgoing one fades out, with a small horizontal
 * lean in the direction of travel so moving left and moving right are
 * distinguishable. `progress` is -1 for a scene left of the active tab, 0 for
 * the active one, and 1 for a scene to its right.
 *
 * Note this is RN's `Animated`, not Reanimated: `progress` is an
 * `Animated.Value` owned by the navigator, so the interpolation has to stay in
 * the same animation system. It is driven natively all the same.
 */

import type { BottomTabNavigationOptions } from 'expo-router/js-tabs';

import { distance } from '@/theme/motion';

// The interpolator type itself is not re-exported by the navigator, so it is
// read off the options object, which is.
type SceneStyleInterpolator = NonNullable<BottomTabNavigationOptions['sceneStyleInterpolator']>;

export const tabSceneInterpolator: SceneStyleInterpolator = ({ current }) => ({
  sceneStyle: {
    opacity: current.progress.interpolate({
      inputRange: [-1, 0, 1],
      outputRange: [0, 1, 0],
    }),
    transform: [
      {
        translateX: current.progress.interpolate({
          inputRange: [-1, 0, 1],
          outputRange: [-distance.scene, 0, distance.scene],
        }),
      },
      {
        translateY: current.progress.interpolate({
          // Both directions rise into place; only the horizontal lean is signed.
          inputRange: [-1, 0, 1],
          outputRange: [distance.rise, 0, distance.rise],
        }),
      },
    ],
  },
});
