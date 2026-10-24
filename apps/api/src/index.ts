import { serve } from '@hono/node-server';
import { createAuth } from '@eduos/auth/server';
import { createDatabase, sql } from '@eduos/database';
import { parseEnv } from './config/env.js';
import { createLogger } from './lib/logger.js';
import { createIdentityService } from './modules/identity/service.js';
import { createPlatformService } from './modules/platform/service.js';
import { createApp } from './app/create-app.js';
const env = parseEnv(process.env);
const logger = createLogger(env.LOG_LEVEL);
const connection = createDatabase(env.DATABASE_URL);
connection.pool.on('error', () => logger.write('error', { event: 'database_pool_error' }));
const auth = createAuth(connection.db, {
  baseURL: env.AUTH_BASE_URL,
  secret: env.AUTH_SECRET,
  trustedOrigins: env.CORS_TRUSTED_ORIGINS,
  production: env.NODE_ENV === 'production',
});
const app = createApp({
  env,
  logger,
  auth,
  identity: createIdentityService(connection.db),
  platform: createPlatformService(connection.db),
  checkDatabase: async () => {
    await connection.db.execute(sql`select 1`);
  },
});
// Bind locally by default; deploy behind a trusted same-site TLS proxy.
const server = serve({ fetch: app.fetch, port: env.API_PORT, hostname: '127.0.0.1' }, () =>
  logger.write('info', { event: 'server_started' }),
);
server.on('error', () => {
  logger.write('error', { event: 'server_start_failed' });
  void connection.close().finally(() => process.exit(1));
});
let stopping = false;
async function shutdown() {
  if (stopping) return;
  stopping = true;
  const timeout = setTimeout(() => process.exit(1), 10000);
  timeout.unref();
  server.close(async () => {
    await connection.close();
    clearTimeout(timeout);
    process.exit(0);
  });
}
process.on('SIGTERM', () => {
  void shutdown();
});
process.on('SIGINT', () => {
  void shutdown();
});
