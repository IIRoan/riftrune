import { createApp, startCatalogMetadataWarmup, startSyncCrons } from './app.js';
import { runStartupMigrations } from './db/migrate.js';
import { loadEnv } from './env.js';

async function main() {
  const env = loadEnv();

  await runStartupMigrations(env);

  const ctx = createApp(env);
  ctx.app.listen({ port: env.PORT, hostname: '::' });

  const host = ctx.app.server?.hostname ?? 'localhost';
  const port = ctx.app.server?.port ?? env.PORT;
  console.log(`Riftbound API running at http://${host}:${String(port)}`);

  startCatalogMetadataWarmup(ctx, env);
  startSyncCrons(ctx, env);

  const shutdown = () => {
    // Avoid calling client.end() during bun --watch reloads: a closing pool rejects
    // every new query with CONNECTION_ENDED while the process may still be alive.
    process.exit(0);
  };

  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}

void main().catch((error: unknown) => {
  console.error('Failed to start API:', error);
  process.exit(1);
});

export type App = ReturnType<typeof createApp>['app'];
