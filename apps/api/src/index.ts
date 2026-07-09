import { join } from 'node:path';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { createApp, startCatalogMetadataWarmup, startSyncCrons } from './app.js';
import { loadEnv } from './env.js';

async function main() {
  const env = loadEnv();
  const ctx = createApp(env);

  await migrate(ctx.db, {
    migrationsFolder: join(import.meta.dir, '..', 'drizzle'),
  });

  ctx.app.listen(env.PORT);

  const host = ctx.app.server?.hostname ?? 'localhost';
  const port = ctx.app.server?.port ?? env.PORT;
  console.log(`Riftbound API running at http://${host}:${String(port)}`);

  startCatalogMetadataWarmup(ctx, env);
  startSyncCrons(ctx, env);

  process.on('SIGINT', () => {
    void (async () => {
      await ctx.client.end();
      process.exit(0);
    })();
  });
}

void main().catch((error: unknown) => {
  console.error('Failed to start API:', error);
  process.exit(1);
});

export type App = ReturnType<typeof createApp>['app'];
