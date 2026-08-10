/**
 * Self-hosted Lato (SIL OFL) — bundled in assets/fonts, no network requests.
 * Instrument/mono remains Geist Mono.
 *
 * Professional UI weight ladder (aligned with product design systems that ship
 * Lato — ONS SDC, Timely TUI, Beeline): honest Tailwind → face mapping.
 *
 * | Class           | Weight | Use                                      |
 * |-----------------|--------|------------------------------------------|
 * | font-normal     | 400    | Body, secondary copy, dense reading      |
 * | font-medium     | 500    | Nav labels, mid emphasis, chip idle      |
 * | font-semibold   | 600    | Titles, prices, instrument tags          |
 * | font-bold       | 700    | Primary CTAs, headings that must commit  |
 * | font-black      | 900    | Rare display / hero only                 |
 *
 * Native: each weight is a separate Expo family name + fontWeight "normal".
 * Web: unified `Lato` / `Geist Mono` + numeric fontWeight (Firefox-safe) —
 * see `web-font-faces.ts`.
 */

import type { TextStyle } from 'react-native';

/** Native Expo family names (per-file). */
export const FONT_SANS = {
  normal: 'Lato-Regular',
  medium: 'Lato-Medium',
  semibold: 'Lato-SemiBold',
  bold: 'Lato-Bold',
  extrabold: 'Lato-Bold',
  black: 'Lato-Black',
} as const;

export const FONT_MONO = {
  normal: 'GeistMono-Regular',
  medium: 'GeistMono-Medium',
  semibold: 'GeistMono-SemiBold',
  bold: 'GeistMono-Bold',
} as const;

/** Unified web families — registered with weight descriptors in web-font-faces.ts */
export const WEB_FONT_SANS_FAMILY = 'Lato';
export const WEB_FONT_MONO_FAMILY = 'Geist Mono';

/** CSS numeric weights for the unified web families. */
const WEB_SANS_WEIGHT = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '700',
  black: '900',
} as const satisfies Record<keyof typeof FONT_SANS, TextStyle['fontWeight']>;

const WEB_MONO_WEIGHT = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '700',
  black: '700',
} as const satisfies Record<keyof typeof FONT_SANS, TextStyle['fontWeight']>;

type SansWeightKey = keyof typeof FONT_SANS;

function weightFromClassName(className: string): SansWeightKey {
  if (className.includes('font-black') || className.includes('font-heavy')) {
    return 'black';
  }
  if (className.includes('font-extrabold') || className.includes('font-ultrabold')) {
    return 'extrabold';
  }
  if (className.includes('font-bold')) {
    return 'bold';
  }
  if (className.includes('font-semibold')) {
    return 'semibold';
  }
  if (className.includes('font-medium')) {
    return 'medium';
  }
  return 'normal';
}

/** Web detection without importing `Platform` (keeps bun:test free of RN runtime). */
function isWebRuntime(): boolean {
  if (typeof process !== 'undefined' && process.env.EXPO_OS === 'web') {
    return true;
  }
  return typeof document !== 'undefined' && typeof navigator !== 'undefined';
}

/** Resolve bundled Lato / mono family from Tailwind class string. */
export function fontFamilyForClassName(className?: string): string {
  const value = className ?? '';
  const isMono = /\bfont-mono\b/.test(value);
  const weight = weightFromClassName(value);

  if (isWebRuntime()) {
    return isMono ? WEB_FONT_MONO_FAMILY : WEB_FONT_SANS_FAMILY;
  }

  if (isMono) {
    if (weight === 'extrabold' || weight === 'black') {
      return FONT_MONO.bold;
    }
    return FONT_MONO[weight];
  }
  return FONT_SANS[weight];
}

/**
 * Font styles for Text / TextInput.
 * - Native: per-face family + fontWeight normal (no faux-bold).
 * - Web: unified family + numeric weight so Firefox picks the real face.
 */
export function textFontStyleForClassName(className?: string): TextStyle {
  const value = className ?? '';
  const isMono = /\bfont-mono\b/.test(value);
  const weight = weightFromClassName(value);

  if (isWebRuntime()) {
    return {
      fontFamily: isMono ? WEB_FONT_MONO_FAMILY : WEB_FONT_SANS_FAMILY,
      fontWeight: isMono ? WEB_MONO_WEIGHT[weight] : WEB_SANS_WEIGHT[weight],
      fontStyle: 'normal',
    };
  }

  return {
    fontFamily: fontFamilyForClassName(value),
    fontWeight: 'normal',
    fontStyle: 'normal',
  };
}

export const DEFAULT_SANS = FONT_SANS.normal;
