import { describe, expect, test } from 'bun:test';
import { resolvePublicAppUrl } from '../../src/env.js';

describe('resolvePublicAppUrl', () => {
  test('prefers an explicit PUBLIC_APP_URL', () => {
    expect(
      resolvePublicAppUrl({
        publicAppUrl: 'https://riftbounddev.roan.dev/',
        betterAuthUrl: 'http://localhost:7000',
        nodeEnv: 'development',
      })
    ).toBe('https://riftbounddev.roan.dev');
  });

  test('uses production default when unset', () => {
    expect(
      resolvePublicAppUrl({
        betterAuthUrl: 'https://riftapi.solace.onl',
        nodeEnv: 'production',
      })
    ).toBe('https://rift.solace.onl');
  });

  test('follows a non-loopback BETTER_AUTH_URL in development', () => {
    expect(
      resolvePublicAppUrl({
        betterAuthUrl: 'https://riftbounddev.roan.dev',
        nodeEnv: 'development',
      })
    ).toBe('https://riftbounddev.roan.dev');
  });

  test('falls back to local Expo web for localhost Better Auth', () => {
    expect(
      resolvePublicAppUrl({
        betterAuthUrl: 'http://localhost:7000',
        nodeEnv: 'development',
      })
    ).toBe('http://localhost:7001');
  });
});
