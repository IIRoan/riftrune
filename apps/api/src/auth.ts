import { expo } from '@better-auth/expo';
import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { betterAuth } from 'better-auth';
import type { Database } from './db/client.js';
import type { Env } from './env.js';

export interface AuthApi {
  api: {
    getSession: (input: { headers: Headers }) => Promise<{
      user: { id: string; name: string; email: string; image?: string | null };
      session: { id: string; userId: string; expiresAt: Date };
    } | null>;
  };
  handler: (request: Request) => Response | Promise<Response>;
}

export type Auth = AuthApi;

export function createAuth(db: Database, env: Env): AuthApi {
  const baseOrigin = (() => {
    try {
      return new URL(env.BETTER_AUTH_URL).origin;
    } catch {
      return null;
    }
  })();

  return betterAuth({
    database: drizzleAdapter(db, { provider: 'pg' }),
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
    },
    plugins: [expo()],
    trustedOrigins: [
      'riftbound://',
      'riftbound://*',
      ...(baseOrigin ? [baseOrigin] : []),
      ...(env.NODE_ENV === 'development'
        ? ['exp://', 'exp://**', 'exp://192.168.*.*:*/**', 'http://localhost:3000']
        : []),
    ],
  }) as unknown as AuthApi;
}
