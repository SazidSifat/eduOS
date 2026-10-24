import { z } from 'zod';
import { createDatabase } from './client/index.js';
import { migrateDatabase } from './migrations.js';
const url = z.url().parse(process.env.DATABASE_URL);
const connection = createDatabase(url);
try {
  await migrateDatabase(connection.db);
  console.info('Migrations applied.');
} catch {
  console.error(
    'Migration failed. Check database availability and review the committed migration; no reset was performed.',
  );
  process.exitCode = 1;
} finally {
  await connection.close();
}
