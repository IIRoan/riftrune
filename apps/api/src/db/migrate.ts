import { join } from 'node:path';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import type { Env } from '../env.js';
import { createPostgresOptions } from './client.js';

const TRANSIENT_ERROR_CODES = new Set([
  'ETIMEDOUT',
  'ECONNREFUSED',
  'ECONNRESET',
  'ENOTFOUND',
  'EAI_AGAIN',
]);

export function isTransientDbError(error: unknown): boolean {
  let current: unknown = error;
  const seen = new Set<unknown>();

  while (current && !seen.has(current)) {
    seen.add(current);

    if (current instanceof Error) {
      const withCode = current as Error & { code?: string };
      if (withCode.code && TRANSIENT_ERROR_CODES.has(withCode.code)) {
        return true;
      }
      current = 'cause' in current ? current.cause : undefined;
      continue;
    }

    if (typeof current === 'object' && current !== null && 'code' in current) {
      const code = (current as { code?: unknown }).code;
      if (typeof code === 'string' && TRANSIENT_ERROR_CODES.has(code)) {
        return true;
      }
    }

    break;
  }

  return false;
}

function formatDbError(error: unknown): string {
  if (error instanceof Error) {
    const withCode = error as Error & { code?: string };
    return withCode.code ? `${withCode.code}: ${error.message}` : error.message;
  }
  return String(error);
}

export async function runStartupMigrations(env: Env): Promise<void> {
  const migrationsFolder = join(import.meta.dir, '..', '..', 'drizzle');
  const maxAttempts = env.NODE_ENV === 'production' ? 12 : 1;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const client = postgres(env.DATABASE_URL, {
      ...createPostgresOptions(env),
      max: 1,
    });

    try {
      await migrate(drizzle(client), { migrationsFolder });
      return;
    } catch (error) {
      if (!isTransientDbError(error) || attempt === maxAttempts) {
        throw error;
      }

      const delayMs = Math.min(attempt * 1000, 5000);
      console.warn(
        `Database migration attempt ${String(attempt)}/${String(maxAttempts)} failed (${formatDbError(error)}); retrying in ${String(delayMs)}ms`
      );
      await Bun.sleep(delayMs);
    } finally {
      await client.end({ timeout: 5 });
    }
  }
}
