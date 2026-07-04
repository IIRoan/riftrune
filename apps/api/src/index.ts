import { createApp, startCatalogMetadataWarmup, startSyncCrons } from './app.js';
import { loadEnv } from './env.js';

const env = loadEnv();
const ctx = createApp(env);
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

export type App = typeof ctx.app;
