/**
 * Self-hosted Geist (SIL OFL) — bundled in assets/fonts, no network requests.
 * Matches design/app typography without third-party font CDNs.
 */

export const FONT_SANS = {
  normal: 'Geist-Regular',
  medium: 'Geist-Medium',
  semibold: 'Geist-SemiBold',
  bold: 'Geist-Bold',
  extrabold: 'Geist-Bold',
  black: 'Geist-Black',
} as const;

export const FONT_MONO = {
  normal: 'GeistMono-Regular',
  medium: 'GeistMono-Medium',
  semibold: 'GeistMono-SemiBold',
  bold: 'GeistMono-Bold',
} as const;

export const APP_FONTS = {
  'Geist-Regular': require('@/assets/fonts/Geist-Regular.ttf'),
  'Geist-Medium': require('@/assets/fonts/Geist-Medium.ttf'),
  'Geist-SemiBold': require('@/assets/fonts/Geist-SemiBold.ttf'),
  'Geist-Bold': require('@/assets/fonts/Geist-Bold.ttf'),
  'Geist-Black': require('@/assets/fonts/Geist-Black.ttf'),
  'GeistMono-Regular': require('@/assets/fonts/GeistMono-Regular.ttf'),
  'GeistMono-Medium': require('@/assets/fonts/GeistMono-Medium.ttf'),
  'GeistMono-SemiBold': require('@/assets/fonts/GeistMono-SemiBold.ttf'),
  'GeistMono-Bold': require('@/assets/fonts/GeistMono-Bold.ttf'),
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

/** Resolve bundled Geist family from Tailwind class string. */
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

export const DEFAULT_SANS = FONT_SANS.normal;
export const DEFAULT_MONO = FONT_MONO.normal;
