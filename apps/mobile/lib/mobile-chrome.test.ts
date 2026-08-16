import { describe, expect, test } from 'bun:test';
import { tabBarContentInset } from '@/constants/Layout';
import { listBottomInset, mobileTabBarVisible } from '@/lib/mobile-chrome';

describe('mobileTabBarVisible', () => {
  test('shows on primary tab routes', () => {
    expect(mobileTabBarVisible('/search', false)).toBe(true);
    expect(mobileTabBarVisible('/decks', false)).toBe(true);
    expect(mobileTabBarVisible('/decks/browse', false)).toBe(true);
    expect(mobileTabBarVisible('/collection', false)).toBe(true);
  });

  test('hides on deep deck builder/editor routes', () => {
    expect(mobileTabBarVisible('/decks/abc', false)).toBe(false);
    expect(mobileTabBarVisible('/decks/abc/add', false)).toBe(false);
  });

  test('hides on play, card modals, and desktop rail', () => {
    expect(mobileTabBarVisible('/play', false)).toBe(false);
    expect(mobileTabBarVisible('/play/setup', false)).toBe(false);
    expect(mobileTabBarVisible('/card/OGN-001', false)).toBe(false);
    expect(mobileTabBarVisible('/search', true)).toBe(false);
  });
});

describe('listBottomInset', () => {
  test('reserves the floating tab bar when it is visible', () => {
    expect(listBottomInset(34, true)).toBe(tabBarContentInset(34));
    expect(listBottomInset(34, true)).toBeGreaterThan(100);
  });

  test('drops tab-bar clearance when the bar is hidden', () => {
    expect(listBottomInset(34, false)).toBe(50);
    expect(listBottomInset(34, false)).toBeLessThan(tabBarContentInset(34));
  });
});
