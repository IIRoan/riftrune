import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import type { Options } from 'postgres';
import type { Env } from '../env.js';
import * as authSchema from './auth-schema.js';
import * as schema from './schema.js';

const fullSchema = { ...authSchema, ...schema };

function resolveSsl(databaseUrl: string): Options<Record<string, never>>['ssl'] | undefined {
  try {
    const sslmode = new URL(databaseUrl).searchParams.get('sslmode');
    if (sslmode === 'require' || sslmode === 'verify-full' || sslmode === 'verify-ca') {
      return 'require';
    }
  } catch {
    // Fall back to the driver's default parsing.
  }
  return undefined;
}

export function createPostgresOptions(env: Env): Options<Record<string, never>> {
  const isProduction = env.NODE_ENV === 'production';
  const ssl = resolveSsl(env.DATABASE_URL);

  return {
    max: env.DB_POOL_MAX ?? (isProduction ? 5 : 20),
    idle_timeout: 20,
    connect_timeout: isProduction ? 30 : 10,
    prepare: false,
    ...(ssl ? { ssl } : {}),
  };
}

export function createDb(env: Env) {
  const client = postgres(env.DATABASE_URL, createPostgresOptions(env));
  const db = drizzle(client, { schema: fullSchema });
  return { db, client };
}

export type Database = ReturnType<typeof createDb>['db'];
