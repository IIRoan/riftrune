import { expo } from '@better-auth/expo';
import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { betterAuth } from 'better-auth';
import type { Database } from './db/client.js';
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
  return betterAuth({
    database: drizzleAdapter(db, { provider: 'pg' }),
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
    },
    plugins: [expo()],
    trustedOrigins: resolveTrustedOrigins(env),
  }) as unknown as AuthApi;
}
