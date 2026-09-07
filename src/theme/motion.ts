/**
 * Motion tokens.
 *
 * The design has one movement idea — the `kazi-rise` keyframe: fade in while
 * sliding up a few pixels, on an ease-out cubic. Everything that moves is a
 * variation of it, at one of three speeds. Keeping the numbers here rather than
 * scattered through components is what stops a screen transition, a row
 * entrance and a sheet from each easing slightly differently.
 *
 * Speeds:
 *   fast   a control answering a touch — a chip, a toggle, a press state
 *   base   something appearing in place — a row, a card, a view swapping
 *   slow   something arriving from off screen — a sheet, a pushed screen
 *
 * Distances are deliberately small. A 6-8px rise reads as the content settling;
 * anything more reads as the content flying in, and gets tiring on a screen a
 * shop-floor supervisor opens forty times a day.
 */

import { Easing } from 'react-native-reanimated';
import { Easing as RNEasing } from 'react-native';

export const duration = {
  fast: 150,
  base: 220,
  slow: 300,
} as const;

export const distance = {
  /** The `kazi-rise` vertical travel. */
  rise: 6,
  /** Horizontal travel for a forward/back swap inside a screen. */
  push: 24,
  /** Horizontal travel for a tab scene, which is a longer trip. */
  scene: 12,
} as const;

/** Ease-out cubic — the design's only easing curve, for Reanimated. */
export const easeOut = Easing.out(Easing.cubic);

/** The same curve for React Navigation / RN `Animated`, which take an RN easing. */
export const easeOutRN = RNEasing.out(RNEasing.cubic);

/**
 * Transition spec for the bottom-tab navigator. `timing` rather than `spring`:
 * a tab switch should feel decisive and identical every time, and a spring's
 * settle reads as lag when you are moving between tabs quickly.
 */
export const tabTransitionSpec = {
  animation: 'timing',
  config: { duration: duration.base, easing: easeOutRN },
} as const;
