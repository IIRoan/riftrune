/** Pure @font-face helpers (no Asset/DOM); `font-display: block` + `document.fonts` wait avoids Firefox FOUT. */

import { WEB_FONT_MONO_FAMILY, WEB_FONT_SANS_FAMILY } from '@/lib/fonts';

export const WEB_FONT_FACE_STYLE_ID = 'astral-grove-web-font-faces';
export const WEB_FONT_DISPLAY = 'block' as const;
export const WEB_FONT_READY_TIMEOUT_MS = 3000;

export function webFontFaceRule(
  family: string,
  uri: string,
  weight: string | number
): string {
  return `@font-face{font-family:${JSON.stringify(family)};src:url(${JSON.stringify(uri)}) format("truetype");font-weight:${weight};font-style:normal;font-display:${WEB_FONT_DISPLAY}}`;
}

export const WEB_FONT_LOAD_SPECS = [
  `400 16px ${JSON.stringify(WEB_FONT_SANS_FAMILY)}`,
  `500 16px ${JSON.stringify(WEB_FONT_SANS_FAMILY)}`,
  `600 16px ${JSON.stringify(WEB_FONT_SANS_FAMILY)}`,
  `700 16px ${JSON.stringify(WEB_FONT_SANS_FAMILY)}`,
  `400 16px ${JSON.stringify(WEB_FONT_MONO_FAMILY)}`,
  `500 16px ${JSON.stringify(WEB_FONT_MONO_FAMILY)}`,
] as const;

export async function waitForCssFontLoads(
  fontSet: { load: (spec: string) => Promise<unknown> } | undefined,
  specs: readonly string[],
  timeoutMs: number
): Promise<void> {
  if (!fontSet?.load) return;
  try {
    await Promise.race([
      Promise.all(specs.map((spec) => fontSet.load(spec))),
      new Promise<void>((resolve) => {
        setTimeout(resolve, timeoutMs);
      }),
    ]);
  } catch {
    // Proceed rather than hanging boot if a face fails to parse.
  }
}
