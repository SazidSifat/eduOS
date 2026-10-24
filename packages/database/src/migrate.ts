import { createDatabase, type DatabaseConnection } from './client/index.js';
import { migrateDatabase } from './migrations.js';
import { migrationFailureMessage, parseMigrationOptions } from './migration-options.js';

async function main() {
  let options: ReturnType<typeof parseMigrationOptions>;
  try {
    options = parseMigrationOptions(process.env, process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Invalid migration configuration.');
    process.exitCode = 1;
    return;
  }

  let connection: DatabaseConnection | undefined;
  try {
    connection = createDatabase(options.url);
    await connection.pool.query('SELECT 1');
    if (options.checkOnly) {
      console.info('Database connection verified. No migrations were applied.');
      return;
    }
    await migrateDatabase(connection.db);
    console.info('Committed migrations applied. Already-applied migrations were skipped.');
  } catch (error) {
    console.error(
      `${options.checkOnly ? 'Database check' : 'Migration'} failed: ${migrationFailureMessage(error)}`,
    );
    process.exitCode = 1;
  } finally {
    await connection?.close();
  }
}

await main();
