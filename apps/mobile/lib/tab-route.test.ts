import { describe, expect, test } from 'bun:test';
import { tabIdFromPathname } from './tab-route';

describe('tabIdFromPathname', () => {
  test('matches bare and group-prefixed tab paths', () => {
    expect(tabIdFromPathname('/collection')).toBe('collection');
    expect(tabIdFromPathname('/(tabs)/collection')).toBe('collection');
    expect(tabIdFromPathname('/decks/abc')).toBe('decks');
    expect(tabIdFromPathname('/(tabs)/decks/browse')).toBe('decks');
    expect(tabIdFromPathname('/settings')).toBe('settings');
    expect(tabIdFromPathname('/search')).toBe('search');
    expect(tabIdFromPathname('/')).toBe('search');
  });
});
