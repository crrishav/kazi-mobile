// Raw palette values ported 1:1 from the Kazi Design style guide.
// Components should never import this directly — consume semantic roles
// from `theme/index.ts` instead.

export const lightColors = {
  ink900: '#0D1F19',
  ink800: '#0F241D',
  ink600: '#3B4F47',
  ink500: '#5B6C64',
  line: '#E6E1D5',
  paper: '#F7F4EC',
  page: '#EFEBE1',
  white: '#FFFFFF',

  mint: '#5FD2A0',
  mintHover: '#4FC492',
  mintDeep: '#147A57',
  mintWash: '#E2F6EC',
  mintWashText: '#0E5E43',

  clay: '#C0603C',
  clayHover: '#A9502F',
  clayWash: '#F8E7DF',
  clayWashText: '#8E4327',
  clayText: '#FFF6F1',

  amber: '#B98514',
  amberWash: '#F7EEDA',
  amberWashText: '#7A5709',

  draftWash: '#EDEFEC',
  draftWashText: '#4A5A53',
  draftDot: '#8A9A92',

  onTrackDot: '#22A97A',

  // Foreground used on an ink900 surface *within an otherwise light screen*
  // (the one inverted "highlight" card per screen) — e.g. avatar initials.
  onInvertedMutedText: '#9DB2A7',
  onInvertedAvatarText: '#BFE9D5',
} as const;

export const darkColors = {
  base: '#0A1512',
  surface: '#10201A',
  surfaceLine: '#1D3129',
  raised: '#16281F',
  line: '#23372E',
  text: '#E9F1EC',
  textMuted: '#7E958A',

  mint: '#6FDDA9',
  mintText: '#08251A',
  mintWashRgba: 'rgba(111,221,169,0.16)',
  mintWashTextOnDark: '#6FDDA9',

  clay: '#E08A63',
  clayWashRgba: 'rgba(224,138,99,0.18)',
  clayWashTextOnDark: '#E8A183',

  amberWashRgba: 'rgba(185,133,20,0.18)',
  amberWashTextOnDark: '#DBB55C',
} as const;
