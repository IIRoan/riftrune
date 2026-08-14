import { describe, expect, test } from 'bun:test';
import {
  buildDeckShareUrl,
  resolveAppOrigin,
  deckSharePath,
} from '@/lib/deck-share-url';

describe('deck-share-url', () => {
  test('builds path with encoded id', () => {
    expect(deckSharePath('abc')).toBe('/decks/abc');
    expect(deckSharePath('a/b')).toBe('/decks/a%2Fb');
  });

  test('prefers explicit web origin over env', () => {
    const prevApp = process.env.EXPO_PUBLIC_APP_URL;
    process.env.EXPO_PUBLIC_APP_URL = 'https://astral-grove.com';

    expect(resolveAppOrigin('https://riftbounddev.roan.dev/')).toBe(
      'https://riftbounddev.roan.dev'
    );
    expect(buildDeckShareUrl('deck_1', 'https://riftbounddev.roan.dev')).toBe(
      'https://riftbounddev.roan.dev/decks/deck_1'
    );

    process.env.EXPO_PUBLIC_APP_URL = prevApp;
  });

  test('uses env origin when web origin is absent', () => {
    const prevApp = process.env.EXPO_PUBLIC_APP_URL;
    const prevDev = process.env.EXPO_DEV_SERVER_ORIGIN;
    process.env.EXPO_PUBLIC_APP_URL = 'https://example.test/';
    delete process.env.EXPO_DEV_SERVER_ORIGIN;

    expect(resolveAppOrigin()).toBe('https://example.test');
    expect(buildDeckShareUrl('deck_9')).toBe('https://example.test/decks/deck_9');

    process.env.EXPO_PUBLIC_APP_URL = prevApp;
    process.env.EXPO_DEV_SERVER_ORIGIN = prevDev;
  });

  test('falls back to production host', () => {
    const prevApp = process.env.EXPO_PUBLIC_APP_URL;
    const prevDev = process.env.EXPO_DEV_SERVER_ORIGIN;
    delete process.env.EXPO_PUBLIC_APP_URL;
    delete process.env.EXPO_DEV_SERVER_ORIGIN;

    expect(resolveAppOrigin()).toBe('https://rift.solace.onl');

    process.env.EXPO_PUBLIC_APP_URL = prevApp;
    process.env.EXPO_DEV_SERVER_ORIGIN = prevDev;
  });
});
