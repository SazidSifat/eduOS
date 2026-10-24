import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../schema/index.js';
export function createDatabase(connectionString: string) {
  // Respect URL sslmode; never disable certificate verification here.
  const pool = new Pool({
    connectionString,
    max: 10,
    connectionTimeoutMillis: 3000,
    idleTimeoutMillis: 30000,
    options: '-c timezone=UTC -c statement_timeout=10000',
  });
  const db = drizzle(pool, { schema });
  return { db, pool, transaction: db.transaction.bind(db), close: () => pool.end() };
}
export type Database = ReturnType<typeof createDatabase>['db'];
export type DatabaseConnection = ReturnType<typeof createDatabase>;
