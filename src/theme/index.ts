import type { ColorSchemeName } from 'react-native';

import { darkColors, lightColors } from './colors';
import { darkShadows, lightShadows, type ShadowScale } from './shadows';
import { radii } from './radii';
import { spacing } from './spacing';
import { fontFamily, tabularNums, textStyles } from './typography';

export { fontFamily, radii, spacing, tabularNums, textStyles };
export type { ShadowKey } from './shadows';
export type { TextStyleKey } from './typography';

/**
 * Foreground palette for content sitting on a dark surface: the full dark
 * theme (everywhere), and light theme's single per-screen "inverted" card.
 * Kept as its own object because the design reuses the same on-dark
 * foreground colors in both contexts — only `textMuted` differs.
 */
export interface OnDarkPalette {
  text: string;
  textMuted: string;
  accent: string;
  accentWash: string;
  accentWashText: string;
  dangerWash: string;
  dangerWashText: string;
  warningWash: string;
  warningWashText: string;
  avatarBg: string;
  avatarText: string;
}

export interface Theme {
  scheme: 'light' | 'dark';

  background: string;
  surface: string;
  surfaceRaised: string;
  /** The one "highlight" card per screen. Light: ink900. Dark: same as surfaceRaised — dark mode never doubles down on inversion. */
  surfaceInverted: string;
  border: string;

  textPrimary: string;
  textSecondary: string;
  link: string;

  accent: string;
  accentHover: string;
  accentText: string;
  /** Ghost-button / link-style text in the accent color. */
  accentDeep: string;
  accentWash: string;
  accentWashText: string;

  danger: string;
  dangerHover: string;
  dangerText: string;
  dangerWash: string;
  dangerWashText: string;

  warning: string;
  warningWash: string;
  warningWashText: string;

  draftWash: string;
  draftWashText: string;
  draftDot: string;

  onDark: OnDarkPalette;
  shadows: ShadowScale;
}

export const lightTheme: Theme = {
  scheme: 'light',

  background: lightColors.page,
  surface: lightColors.white,
  surfaceRaised: lightColors.paper,
  surfaceInverted: lightColors.ink900,
  border: lightColors.line,

  textPrimary: lightColors.ink800,
  textSecondary: lightColors.ink500,
  link: lightColors.mintDeep,

  accent: lightColors.mint,
  accentHover: lightColors.mintHover,
  accentText: '#08251A',
  accentDeep: lightColors.mintDeep,
  accentWash: lightColors.mintWash,
  accentWashText: lightColors.mintWashText,

  danger: lightColors.clay,
  dangerHover: lightColors.clayHover,
  dangerText: lightColors.clayText,
  dangerWash: lightColors.clayWash,
  dangerWashText: lightColors.clayWashText,

  warning: lightColors.amber,
  warningWash: lightColors.amberWash,
  warningWashText: lightColors.amberWashText,

  draftWash: lightColors.draftWash,
  draftWashText: lightColors.draftWashText,
  draftDot: lightColors.draftDot,

  onDark: {
    text: darkColors.text,
    textMuted: lightColors.onInvertedMutedText,
    accent: darkColors.mint,
    accentWash: darkColors.mintWashRgba,
    accentWashText: darkColors.mintWashTextOnDark,
    dangerWash: darkColors.clayWashRgba,
    dangerWashText: darkColors.clayWashTextOnDark,
    warningWash: darkColors.amberWashRgba,
    warningWashText: darkColors.amberWashTextOnDark,
    avatarBg: darkColors.raised,
    avatarText: lightColors.onInvertedAvatarText,
  },
  shadows: lightShadows,
};

export const darkTheme: Theme = {
  scheme: 'dark',

  background: darkColors.base,
  surface: darkColors.surface,
  surfaceRaised: darkColors.raised,
  surfaceInverted: darkColors.raised,
  border: darkColors.line,

  textPrimary: darkColors.text,
  textSecondary: darkColors.textMuted,
  link: darkColors.mint,

  accent: darkColors.mint,
  accentHover: darkColors.mint,
  accentText: darkColors.mintText,
  accentDeep: darkColors.mint,
  accentWash: darkColors.mintWashRgba,
  accentWashText: darkColors.mintWashTextOnDark,

  danger: darkColors.clay,
  dangerHover: darkColors.clay,
  dangerText: darkColors.mintText,
  dangerWash: darkColors.clayWashRgba,
  dangerWashText: darkColors.clayWashTextOnDark,

  warning: darkColors.amberWashTextOnDark,
  warningWash: darkColors.amberWashRgba,
  warningWashText: darkColors.amberWashTextOnDark,

  draftWash: darkColors.raised,
  draftWashText: darkColors.textMuted,
  draftDot: darkColors.textMuted,

  onDark: {
    text: darkColors.text,
    textMuted: darkColors.textMuted,
    accent: darkColors.mint,
    accentWash: darkColors.mintWashRgba,
    accentWashText: darkColors.mintWashTextOnDark,
    dangerWash: darkColors.clayWashRgba,
    dangerWashText: darkColors.clayWashTextOnDark,
    warningWash: darkColors.amberWashRgba,
    warningWashText: darkColors.amberWashTextOnDark,
    avatarBg: darkColors.raised,
    avatarText: darkColors.mint,
  },
  shadows: darkShadows,
};

export function themeFor(scheme: ColorSchemeName): Theme {
  return scheme === 'dark' ? darkTheme : lightTheme;
}
