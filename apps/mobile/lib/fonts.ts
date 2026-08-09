/**
 * Self-hosted Geist (SIL OFL) — bundled in assets/fonts, no network requests.
 *
 * Operate UI uses a thickened baseline: Tailwind `font-normal` maps to Medium
 * (500), and `font-medium`/`font-semibold` map to SemiBold (600).
 *
 * Native / Expo: each weight is a separate family name; pair with fontWeight
 * "normal" so the face file is used as-is.
 *
 * Web (esp. Firefox): use unified family `Geist` / `Geist Mono` with numeric
 * fontWeight so `@font-face` weight descriptors match. Expo's default faces
 * omit font-weight, which breaks Firefox matching — see `web-font-faces.ts`
 * and `ensureWebFontFaces()` from `useAppFonts`.
 */

import type { TextStyle } from 'react-native';

/** Native Expo family names (per-file). */
export const FONT_SANS = {
  /** Operate baseline — Medium, not Regular. */
  normal: 'Geist-Medium',
  medium: 'Geist-SemiBold',
  semibold: 'Geist-SemiBold',
  bold: 'Geist-Bold',
  extrabold: 'Geist-Bold',
  black: 'Geist-Black',
} as const;

export const FONT_MONO = {
  /** Instrument baseline — Medium, not Regular. */
  normal: 'GeistMono-Medium',
  medium: 'GeistMono-SemiBold',
  semibold: 'GeistMono-SemiBold',
  bold: 'GeistMono-Bold',
} as const;

/** Unified web families — registered with weight descriptors in web-font-faces.ts */
export const WEB_FONT_SANS_FAMILY = 'Geist';
export const WEB_FONT_MONO_FAMILY = 'Geist Mono';

/** CSS numeric weights for the unified web families. */
const WEB_SANS_WEIGHT = {
  normal: '500',
  medium: '600',
  semibold: '600',
  bold: '700',
  extrabold: '700',
  black: '900',
} as const satisfies Record<keyof typeof FONT_SANS, TextStyle['fontWeight']>;

const WEB_MONO_WEIGHT = {
  normal: '500',
  medium: '600',
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

/** Resolve bundled Geist / mono family from Tailwind class string. */
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
