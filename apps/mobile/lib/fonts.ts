/**
 * Self-hosted Inter (SIL OFL) — bundled in assets/fonts, no network requests.
 * Matches the clean Skiff Sans / professional product-UI look from skiff.com
 * (Skiff Sans itself is proprietary; Inter is the open face their stack references).
 *
 * Each weight is a separate family name (RN / Expo convention). Always pair the
 * selected face with fontWeight/fontStyle "normal" so web (especially Firefox)
 * and Android do not synthesize extra bold on top of an already-weighted file.
 */

import type { TextStyle } from 'react-native';

export const FONT_SANS = {
  normal: 'Inter-Regular',
  medium: 'Inter-Medium',
  semibold: 'Inter-SemiBold',
  bold: 'Inter-Bold',
  extrabold: 'Inter-ExtraBold',
  black: 'Inter-Black',
} as const;

export const FONT_MONO = {
  normal: 'GeistMono-Regular',
  medium: 'GeistMono-Medium',
  semibold: 'GeistMono-SemiBold',
  bold: 'GeistMono-Bold',
} as const;

type SansWeight = (typeof FONT_SANS)[keyof typeof FONT_SANS];
type MonoWeight = (typeof FONT_MONO)[keyof typeof FONT_MONO];

function weightFromClassName(className: string): keyof typeof FONT_SANS {
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

/** Resolve bundled Inter / mono family from Tailwind class string. */
export function fontFamilyForClassName(className?: string): SansWeight | MonoWeight {
  const value = className ?? '';
  const isMono = /\bfont-mono\b/.test(value);
  const weight = weightFromClassName(value);
  if (isMono) {
    if (weight === 'extrabold' || weight === 'black') {
      return FONT_MONO.bold;
    }
    return FONT_MONO[weight];
  }
  return FONT_SANS[weight];
}

/**
 * Font styles for Text / TextInput. Resets CSS weight/style so the chosen
 * face file is used as-is (avoids Firefox faux-bold on Inter-SemiBold + font-semibold).
 */
export function textFontStyleForClassName(className?: string): TextStyle {
  return {
    fontFamily: fontFamilyForClassName(className),
    fontWeight: 'normal',
    fontStyle: 'normal',
  };
}

export const DEFAULT_SANS = FONT_SANS.normal;
export const DEFAULT_MONO = FONT_MONO.normal;
