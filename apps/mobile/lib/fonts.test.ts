import { describe, expect, test } from 'bun:test';
import {
  FONT_MONO,
  FONT_SANS,
  fontFamilyForClassName,
  textFontStyleForClassName,
} from './fonts';

describe('fontFamilyForClassName', () => {
  test('maps weight classes to Inter faces', () => {
    expect(fontFamilyForClassName('font-sans font-normal')).toBe(FONT_SANS.normal);
    expect(fontFamilyForClassName('font-medium')).toBe(FONT_SANS.medium);
    expect(fontFamilyForClassName('font-semibold')).toBe(FONT_SANS.semibold);
    expect(fontFamilyForClassName('font-bold')).toBe(FONT_SANS.bold);
    expect(fontFamilyForClassName('font-extrabold')).toBe(FONT_SANS.extrabold);
    expect(fontFamilyForClassName('font-black')).toBe(FONT_SANS.black);
  });

  test('maps mono + weight to GeistMono faces', () => {
    expect(fontFamilyForClassName('font-mono font-semibold')).toBe(FONT_MONO.semibold);
    expect(fontFamilyForClassName('font-mono font-black')).toBe(FONT_MONO.bold);
  });
});

describe('textFontStyleForClassName', () => {
  test('resets CSS weight so web does not faux-bold a weighted face', () => {
    expect(textFontStyleForClassName('font-semibold text-foreground')).toEqual({
      fontFamily: FONT_SANS.semibold,
      fontWeight: 'normal',
      fontStyle: 'normal',
    });
  });
});
