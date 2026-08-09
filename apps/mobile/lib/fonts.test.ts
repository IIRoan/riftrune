import { describe, expect, test } from 'bun:test';
import {
  FONT_MONO,
  FONT_SANS,
  WEB_FONT_MONO_FAMILY,
  WEB_FONT_SANS_FAMILY,
  fontFamilyForClassName,
  textFontStyleForClassName,
} from './fonts';

describe('fontFamilyForClassName', () => {
  test('maps weight classes to thickened Operate Geist faces (native names)', () => {
    // Bun unit tests run with Platform.OS !== 'web'
    expect(fontFamilyForClassName('font-sans font-normal')).toBe(FONT_SANS.normal);
    expect(fontFamilyForClassName('font-medium')).toBe(FONT_SANS.medium);
    expect(fontFamilyForClassName('font-semibold')).toBe(FONT_SANS.semibold);
    expect(fontFamilyForClassName('font-bold')).toBe(FONT_SANS.bold);
    expect(fontFamilyForClassName('font-extrabold')).toBe(FONT_SANS.extrabold);
    expect(fontFamilyForClassName('font-black')).toBe(FONT_SANS.black);
    expect(FONT_SANS.normal).toBe('Geist-Medium');
  });

  test('maps mono + weight to thickened GeistMono faces', () => {
    expect(fontFamilyForClassName('font-mono')).toBe(FONT_MONO.normal);
    expect(fontFamilyForClassName('font-mono font-medium')).toBe(FONT_MONO.medium);
    expect(fontFamilyForClassName('font-mono font-semibold')).toBe(FONT_MONO.semibold);
    expect(fontFamilyForClassName('font-mono font-black')).toBe(FONT_MONO.bold);
  });

  test('exports unified web family constants for Firefox @font-face matching', () => {
    expect(WEB_FONT_SANS_FAMILY).toBe('Geist');
    expect(WEB_FONT_MONO_FAMILY).toBe('Geist Mono');
  });
});

describe('textFontStyleForClassName', () => {
  test('resets CSS weight on native so the face file is used as-is', () => {
    expect(textFontStyleForClassName('font-semibold text-foreground')).toEqual({
      fontFamily: FONT_SANS.semibold,
      fontWeight: 'normal',
      fontStyle: 'normal',
    });
  });
});
