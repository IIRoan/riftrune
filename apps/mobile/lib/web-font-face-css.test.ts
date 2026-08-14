import { describe, expect, test } from 'bun:test';
import {
  WEB_FONT_DISPLAY,
  WEB_FONT_LOAD_SPECS,
  waitForCssFontLoads,
  webFontFaceRule,
} from './web-font-face-css';

describe('webFontFaceRule', () => {
  test('emits a unified family with explicit weight and block display', () => {
    expect(webFontFaceRule('Lato', '/fonts/Lato-Regular.ttf', 400)).toBe(
      '@font-face{font-family:"Lato";src:url("/fonts/Lato-Regular.ttf") format("truetype");font-weight:400;font-style:normal;font-display:block}'
    );
    expect(WEB_FONT_DISPLAY).toBe('block');
  });

  test('quotes multi-word families so Firefox can match them', () => {
    expect(
      webFontFaceRule('Geist Mono', '/fonts/GeistMono-Regular.ttf', 500)
    ).toContain('font-family:"Geist Mono"');
  });
});

describe('WEB_FONT_LOAD_SPECS', () => {
  test('loads Lato weights used on first paint plus mono', () => {
    expect(WEB_FONT_LOAD_SPECS).toContain('400 16px "Lato"');
    expect(WEB_FONT_LOAD_SPECS).toContain('600 16px "Lato"');
    expect(WEB_FONT_LOAD_SPECS).toContain('400 16px "Geist Mono"');
  });
});

describe('waitForCssFontLoads', () => {
  test('resolves when every spec loads', async () => {
    const loaded: string[] = [];
    await waitForCssFontLoads(
      {
        load: async (spec) => {
          loaded.push(spec);
        },
      },
      ['400 16px "Lato"', '700 16px "Lato"'],
      1000
    );
    expect(loaded).toEqual(['400 16px "Lato"', '700 16px "Lato"']);
  });

  test('resolves on timeout instead of hanging', async () => {
    const started = Date.now();
    await waitForCssFontLoads(
      {
        load: () => new Promise(() => undefined),
      },
      ['400 16px "Lato"'],
      20
    );
    expect(Date.now() - started).toBeLessThan(500);
  });

  test('no-ops without a FontFaceSet', async () => {
    await waitForCssFontLoads(undefined, ['400 16px "Lato"'], 20);
  });
});
