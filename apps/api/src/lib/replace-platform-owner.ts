import { z } from 'zod';
import { createDatabase } from '@eduos/database';
import { parseEnv } from '../config/env.js';
import { replacePlatformOwner } from '../modules/platform/replace-owner.js';

const env = parseEnv(process.env);
if (env.NODE_ENV !== 'development')
  throw new Error('Platform owner replacement is disabled outside development.');

const email = z.email().safeParse(process.env.EDUOS_PLATFORM_REPLACEMENT_EMAIL);
if (!email.success)
  throw new Error('Set EDUOS_PLATFORM_REPLACEMENT_EMAIL to an existing account in apps/api/.env.');

const connection = createDatabase(env.DATABASE_URL);
try {
  await replacePlatformOwner(connection.db, email.data);
  console.info(
    'Super Admin handoff completed. The previous identity and audit history were retained.',
  );
} catch {
  console.error('Super Admin handoff failed. Verify the target account and active operator state.');
  process.exitCode = 1;
} finally {
  await connection.close();
}
