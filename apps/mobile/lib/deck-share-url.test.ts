import { describe, expect, test } from 'bun:test';
import {
  buildRiftruneDeckUrl,
  resolveRiftruneAppOrigin,
  riftruneDeckPath,
} from '@/lib/deck-share-url';

describe('deck-share-url', () => {
  test('builds path with encoded id', () => {
    expect(riftruneDeckPath('abc')).toBe('/decks/abc');
    expect(riftruneDeckPath('a/b')).toBe('/decks/a%2Fb');
  });

  test('prefers explicit web origin over env', () => {
    const prevApp = process.env.EXPO_PUBLIC_APP_URL;
    process.env.EXPO_PUBLIC_APP_URL = 'https://riftrune.com';

    expect(resolveRiftruneAppOrigin('https://riftbounddev.roan.dev/')).toBe(
      'https://riftbounddev.roan.dev'
    );
    expect(buildRiftruneDeckUrl('deck_1', 'https://riftbounddev.roan.dev')).toBe(
      'https://riftbounddev.roan.dev/decks/deck_1'
    );

    process.env.EXPO_PUBLIC_APP_URL = prevApp;
  });

  test('uses env origin when web origin is absent', () => {
    const prevApp = process.env.EXPO_PUBLIC_APP_URL;
    const prevDev = process.env.EXPO_DEV_SERVER_ORIGIN;
    process.env.EXPO_PUBLIC_APP_URL = 'https://example.test/';
    delete process.env.EXPO_DEV_SERVER_ORIGIN;

    expect(resolveRiftruneAppOrigin()).toBe('https://example.test');
    expect(buildRiftruneDeckUrl('deck_9')).toBe('https://example.test/decks/deck_9');

    process.env.EXPO_PUBLIC_APP_URL = prevApp;
    process.env.EXPO_DEV_SERVER_ORIGIN = prevDev;
  });

  test('falls back to production host', () => {
    const prevApp = process.env.EXPO_PUBLIC_APP_URL;
    const prevDev = process.env.EXPO_DEV_SERVER_ORIGIN;
    delete process.env.EXPO_PUBLIC_APP_URL;
    delete process.env.EXPO_DEV_SERVER_ORIGIN;

    expect(resolveRiftruneAppOrigin()).toBe('https://riftrune.com');

    process.env.EXPO_PUBLIC_APP_URL = prevApp;
    process.env.EXPO_DEV_SERVER_ORIGIN = prevDev;
  });
});
