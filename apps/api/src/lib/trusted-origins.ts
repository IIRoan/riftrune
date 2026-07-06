import type { Env } from '../env.js';

/** Origins allowed for Better Auth and browser CORS in production. */
export function resolveTrustedOrigins(env: Env): string[] {
  const baseOrigin = (() => {
    try {
      return new URL(env.BETTER_AUTH_URL).origin;
    } catch {
      return null;
    }
  })();

  const origins = new Set<string>([
    'riftbound://',
    'riftbound://*',
    ...env.TRUSTED_ORIGINS,
    ...(baseOrigin ? [baseOrigin] : []),
  ]);

  if (env.NODE_ENV === 'development') {
    for (const origin of [
      'exp://',
      'exp://**',
      'exp://192.168.*.*:*/**',
      'http://localhost:7000',
      'http://localhost:7001',
    ]) {
      origins.add(origin);
    }
  }

  return [...origins];
}

export function resolveCorsOrigins(env: Env): true | string[] {
  if (env.NODE_ENV === 'development') return true;

  const browserOrigins = resolveTrustedOrigins(env).filter((origin) =>
    origin.startsWith('http://') || origin.startsWith('https://')
  );

  return browserOrigins.length > 0 ? browserOrigins : true;
}
