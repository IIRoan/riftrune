import { describe, expect, test } from 'bun:test';
import {
  ARCHIVE_THEME_OKLCH,
  contrastForOklchNeutral,
  contrastRatio,
  meetsBodyTextContrast,
  meetsLargeUiContrast,
  oklchNeutralLuminance,
  toolbarContrastReport,
} from '@/lib/themeContrast';

describe('contrastRatio', () => {
  test('identical luminances yield 1:1', () => {
    expect(contrastRatio(0.5, 0.5)).toBeCloseTo(1, 5);
  });

  test('dark theme ink on surface exceeds body text threshold', () => {
    const t = ARCHIVE_THEME_OKLCH.dark;
    expect(contrastForOklchNeutral(t.foreground, t.card)).toBeGreaterThan(4.5);
  });
});

describe('archive theme toolbar contrast', () => {
  test('foreground on card meets body text contrast in light and dark', () => {
    for (const mode of ['light', 'dark'] as const) {
      const t = ARCHIVE_THEME_OKLCH[mode];
      expect(meetsBodyTextContrast(t.foreground, t.card)).toBe(true);
    }
  });

  test('muted foreground on card meets large UI contrast in both themes', () => {
    for (const mode of ['light', 'dark'] as const) {
      const t = ARCHIVE_THEME_OKLCH[mode];
      expect(meetsLargeUiContrast(t.mutedForeground, t.card)).toBe(true);
    }
  });

  test('active segment foreground on card-panel meets body text contrast', () => {
    for (const mode of ['light', 'dark'] as const) {
      const t = ARCHIVE_THEME_OKLCH[mode];
      expect(meetsBodyTextContrast(t.foreground, t.cardPanel)).toBe(true);
    }
  });

  test('toolbar contrast report documents both themes above thresholds', () => {
    const report = toolbarContrastReport();
    expect(report).toHaveLength(2);

    for (const row of report) {
      expect(row.foregroundOnCard).toBeGreaterThanOrEqual(4.5);
      expect(row.mutedOnCard).toBeGreaterThanOrEqual(3);
      expect(row.foregroundOnPanel).toBeGreaterThanOrEqual(4.5);
    }
  });

  test('foreground has higher contrast than muted on the same background', () => {
    for (const mode of ['light', 'dark'] as const) {
      const t = ARCHIVE_THEME_OKLCH[mode];
      const fg = contrastForOklchNeutral(t.foreground, t.card);
      const muted = contrastForOklchNeutral(t.mutedForeground, t.card);
      expect(fg).toBeGreaterThan(muted);
    }
  });

  test('oklch neutral luminance increases with perceptual lightness', () => {
    expect(oklchNeutralLuminance(0.96)).toBeGreaterThan(oklchNeutralLuminance(0.18));
  });
});
