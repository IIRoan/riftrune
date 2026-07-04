import { expo } from '@better-auth/expo';
import { bearer } from 'better-auth/plugins';
import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { betterAuth } from 'better-auth';
import type { Database } from './db/client.js';
import { resolveAuthCookieDomain } from './lib/auth-cookie-domain.js';
import type { Env } from './env.js';
import { resolveTrustedOrigins } from './lib/trusted-origins.js';

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
  const cookieDomain = resolveAuthCookieDomain(env);

  return betterAuth({
    database: drizzleAdapter(db, { provider: 'pg' }),
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
    },
    plugins: [expo(), bearer()],
    trustedOrigins: resolveTrustedOrigins(env),
    ...(cookieDomain
      ? {
          advanced: {
            crossSubDomainCookies: {
              enabled: true,
              domain: cookieDomain,
            },
            defaultCookieAttributes: {
              secure: true,
              httpOnly: true,
              sameSite: 'lax',
            },
          },
        }
      : {}),
  }) as unknown as AuthApi;
}
