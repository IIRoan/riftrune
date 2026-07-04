import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import type { Env } from '../env.js';
import * as authSchema from './auth-schema.js';
import * as schema from './schema.js';

const fullSchema = { ...authSchema, ...schema };

export function createDb(env: Env) {
  const poolMax = env.DB_POOL_MAX ?? (env.NODE_ENV === 'production' ? 5 : 20);
  const client = postgres(env.DATABASE_URL, {
    max: poolMax,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
  });
  const db = drizzle(client, { schema: fullSchema });
  return { db, client };
}

export type Database = ReturnType<typeof createDb>['db'];
