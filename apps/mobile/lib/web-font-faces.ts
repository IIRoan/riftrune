/**
 * Web-only font-face registration for Firefox-correct weight matching.
 *
 * Expo's loader emits `@font-face { font-family: "Lato-Medium"; src: … }` with
 * no `font-weight` descriptor. Firefox then fails to match when Uniwind sets
 * numeric CSS weights. Spec guidance: one family name, explicit weight per file
 * (MDN `@font-face` font-weight; Expo PR #37170).
 *
 * Native keeps Expo per-file family names (`Lato-Medium`, etc.).
 *
 * Inject these rules before first UI paint. `font-display: swap` plus a
 * post-paint `useEffect` is what made Firefox flash a system face on load.
 */

import { Asset } from 'expo-asset';
import { Platform } from 'react-native';
import { WEB_FONT_MONO_FAMILY, WEB_FONT_SANS_FAMILY } from '@/lib/fonts';
import {
  WEB_FONT_FACE_STYLE_ID,
  WEB_FONT_LOAD_SPECS,
  WEB_FONT_READY_TIMEOUT_MS,
  waitForCssFontLoads,
  webFontFaceRule,
} from '@/lib/web-font-face-css';

export { WEB_FONT_FACE_STYLE_ID };

type FontModuleId = number | string;

type Face = {
  family: typeof WEB_FONT_SANS_FAMILY | typeof WEB_FONT_MONO_FAMILY;
  weight: number;
  moduleId: FontModuleId;
};

const FACES: Face[] = [
  {
    family: WEB_FONT_SANS_FAMILY,
    weight: 400,
    moduleId: require('@/assets/fonts/Lato-Regular.ttf'),
  },
  {
    family: WEB_FONT_SANS_FAMILY,
    weight: 500,
    moduleId: require('@/assets/fonts/Lato-Medium.ttf'),
  },
  {
    family: WEB_FONT_SANS_FAMILY,
    weight: 600,
    moduleId: require('@/assets/fonts/Lato-SemiBold.ttf'),
  },
  {
    family: WEB_FONT_SANS_FAMILY,
    weight: 700,
    moduleId: require('@/assets/fonts/Lato-Bold.ttf'),
  },
  {
    family: WEB_FONT_SANS_FAMILY,
    weight: 900,
    moduleId: require('@/assets/fonts/Lato-Black.ttf'),
  },
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
 * `fontFamily: 'Lato-Medium'` + CSS `font-weight: 500` still hits the correct
 * file in Firefox instead of falling through. */
const LEGACY_NAMED_FACES: { family: string; moduleId: FontModuleId }[] = [
  { family: 'Lato-Regular', moduleId: require('@/assets/fonts/Lato-Regular.ttf') },
  { family: 'Lato-Medium', moduleId: require('@/assets/fonts/Lato-Medium.ttf') },
  { family: 'Lato-SemiBold', moduleId: require('@/assets/fonts/Lato-SemiBold.ttf') },
  { family: 'Lato-Bold', moduleId: require('@/assets/fonts/Lato-Bold.ttf') },
  { family: 'Lato-Black', moduleId: require('@/assets/fonts/Lato-Black.ttf') },
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

function uriForModule(moduleId: FontModuleId): string | null {
  if (typeof moduleId === 'string') {
    return moduleId.length > 0 ? moduleId : null;
  }
  try {
    const asset = Asset.fromModule(moduleId);
    const uri = asset.uri || asset.localUri;
    return typeof uri === 'string' && uri.length > 0 ? uri : null;
  } catch {
    return null;
  }
}

/** CSS for the document head — safe during static HTML render (no `document`). */
export function getWebFontFaceCss(): string {
  const rules: string[] = [];

  for (const face of FACES) {
    const uri = uriForModule(face.moduleId);
    if (!uri) continue;
    rules.push(webFontFaceRule(face.family, uri, face.weight));
  }

  for (const face of LEGACY_NAMED_FACES) {
    const uri = uriForModule(face.moduleId);
    if (!uri) continue;
    rules.push(webFontFaceRule(face.family, uri, '100 900'));
  }

  return rules.join('\n');
}

export function getWebFontPreloadHrefs(): string[] {
  const hrefs: string[] = [];
  const seen = new Set<string>();
  for (const face of FACES) {
    const uri = uriForModule(face.moduleId);
    if (!uri || seen.has(uri)) continue;
    seen.add(uri);
    hrefs.push(uri);
  }
  return hrefs;
}

function ensureFontPreloads(hrefs: string[]): void {
  if (typeof document === 'undefined') return;
  const existing = new Set(
    [...document.querySelectorAll('link[rel="preload"][as="font"]')].map((node) =>
      node.getAttribute('href')
    )
  );
  for (const href of hrefs) {
    if (existing.has(href)) continue;
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'font';
    link.type = 'font/ttf';
    link.crossOrigin = 'anonymous';
    link.href = href;
    document.head.appendChild(link);
    existing.add(href);
  }
}

/** Inject unified + legacy-range @font-face rules. Safe to call repeatedly. */
export function ensureWebFontFaces(): void {
  if (Platform.OS !== 'web') return;
  if (typeof document === 'undefined') return;

  const css = getWebFontFaceCss();
  if (!css) return;

  ensureFontPreloads(getWebFontPreloadHrefs());

  const existing = document.getElementById(WEB_FONT_FACE_STYLE_ID);
  if (existing instanceof HTMLStyleElement) {
    if (existing.textContent !== css) {
      existing.textContent = css;
    }
    return;
  }

  const style = document.createElement('style');
  style.id = WEB_FONT_FACE_STYLE_ID;
  style.type = 'text/css';
  style.textContent = css;
  document.head.appendChild(style);
}

/** Resolve once the unified families used on web are available to the renderer. */
export async function waitForWebFontFaces(): Promise<void> {
  ensureWebFontFaces();
  if (typeof document === 'undefined') return;
  await waitForCssFontLoads(
    document.fonts,
    WEB_FONT_LOAD_SPECS,
    WEB_FONT_READY_TIMEOUT_MS
  );
}

if (typeof document !== 'undefined') {
  ensureWebFontFaces();
}
