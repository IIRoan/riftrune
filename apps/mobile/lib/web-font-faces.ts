/**
 * Web-only font-face registration for Firefox-correct weight matching.
 *
 * Expo's loader emits `@font-face { font-family: "Geist-Medium"; src: … }` with
 * no `font-weight` descriptor. Firefox then fails to match when Uniwind sets
 * `font-weight: 500`/`600` on the element and can fall back to a thinner face
 * or synthesize awkwardly. Spec + Firefox guidance: one family name, explicit
 * weight per file (MDN `@font-face` font-weight; Expo PR #37170).
 *
 * Native keeps the Expo per-file family names (`Geist-Medium`, etc.).
 */

import { Asset } from 'expo-asset';
import { Platform } from 'react-native';
import {
  WEB_FONT_MONO_FAMILY,
  WEB_FONT_SANS_FAMILY,
} from '@/lib/fonts';

const STYLE_ID = 'riftrune-web-font-faces';

type Face = {
  family: typeof WEB_FONT_SANS_FAMILY | typeof WEB_FONT_MONO_FAMILY;
  weight: number;
  moduleId: number;
};

const FACES: Face[] = [
  { family: WEB_FONT_SANS_FAMILY, weight: 400, moduleId: require('@/assets/fonts/Geist-Regular.ttf') },
  { family: WEB_FONT_SANS_FAMILY, weight: 500, moduleId: require('@/assets/fonts/Geist-Medium.ttf') },
  { family: WEB_FONT_SANS_FAMILY, weight: 600, moduleId: require('@/assets/fonts/Geist-SemiBold.ttf') },
  { family: WEB_FONT_SANS_FAMILY, weight: 700, moduleId: require('@/assets/fonts/Geist-Bold.ttf') },
  { family: WEB_FONT_SANS_FAMILY, weight: 900, moduleId: require('@/assets/fonts/Geist-Black.ttf') },
  {
    family: WEB_FONT_MONO_FAMILY,
    weight: 400,
    moduleId: require('@/assets/fonts/GeistMono-Regular.ttf'),
  },
  {
    family: WEB_FONT_MONO_FAMILY,
    weight: 500,
    moduleId: require('@/assets/fonts/GeistMono-Medium.ttf'),
  },
  {
    family: WEB_FONT_MONO_FAMILY,
    weight: 600,
    moduleId: require('@/assets/fonts/GeistMono-SemiBold.ttf'),
  },
  {
    family: WEB_FONT_MONO_FAMILY,
    weight: 700,
    moduleId: require('@/assets/fonts/GeistMono-Bold.ttf'),
  },
];

/** Re-declare Expo per-weight family names with a full weight range so
 * `fontFamily: 'Geist-Medium'` + CSS `font-weight: 500` still hits the correct
 * file in Firefox instead of falling through. */
const LEGACY_NAMED_FACES: { family: string; moduleId: number }[] = [
  { family: 'Geist-Regular', moduleId: require('@/assets/fonts/Geist-Regular.ttf') },
  { family: 'Geist-Medium', moduleId: require('@/assets/fonts/Geist-Medium.ttf') },
  { family: 'Geist-SemiBold', moduleId: require('@/assets/fonts/Geist-SemiBold.ttf') },
  { family: 'Geist-Bold', moduleId: require('@/assets/fonts/Geist-Bold.ttf') },
  { family: 'Geist-Black', moduleId: require('@/assets/fonts/Geist-Black.ttf') },
  {
    family: 'GeistMono-Regular',
    moduleId: require('@/assets/fonts/GeistMono-Regular.ttf'),
  },
  {
    family: 'GeistMono-Medium',
    moduleId: require('@/assets/fonts/GeistMono-Medium.ttf'),
  },
  {
    family: 'GeistMono-SemiBold',
    moduleId: require('@/assets/fonts/GeistMono-SemiBold.ttf'),
  },
  { family: 'GeistMono-Bold', moduleId: require('@/assets/fonts/GeistMono-Bold.ttf') },
];

function uriForModule(moduleId: number): string | null {
  try {
    const asset = Asset.fromModule(moduleId);
    const uri = asset.uri || asset.localUri;
    return typeof uri === 'string' && uri.length > 0 ? uri : null;
  } catch {
    return null;
  }
}

function buildCss(): string {
  const rules: string[] = [];

  for (const face of FACES) {
    const uri = uriForModule(face.moduleId);
    if (!uri) continue;
    rules.push(
      `@font-face{font-family:${JSON.stringify(face.family)};src:url(${JSON.stringify(uri)}) format("truetype");font-weight:${face.weight};font-style:normal;font-display:swap}`
    );
  }

  for (const face of LEGACY_NAMED_FACES) {
    const uri = uriForModule(face.moduleId);
    if (!uri) continue;
    rules.push(
      `@font-face{font-family:${JSON.stringify(face.family)};src:url(${JSON.stringify(uri)}) format("truetype");font-weight:100 900;font-style:normal;font-display:swap}`
    );
  }

  return rules.join('\n');
}

/** Inject unified + legacy-range @font-face rules. Safe to call repeatedly. */
export function ensureWebFontFaces(): void {
  if (Platform.OS !== 'web') return;
  if (typeof document === 'undefined') return;

  const existing = document.getElementById(STYLE_ID);
  const css = buildCss();
  if (!css) return;

  if (existing instanceof HTMLStyleElement) {
    if (existing.textContent !== css) {
      existing.textContent = css;
    }
    return;
  }

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.type = 'text/css';
  style.textContent = css;
  document.head.appendChild(style);
}
