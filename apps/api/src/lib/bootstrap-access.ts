import { z } from 'zod';
import { createDatabase } from '@eduos/database';
import { parseEnv } from '../config/env.js';
import { bootstrapInstitutionAdmin } from '../modules/identity/bootstrap.js';
import { bootstrapPlatformOwner } from '../modules/platform/bootstrap.js';

const env = parseEnv(process.env);
if (env.NODE_ENV !== 'development') throw new Error('Access bootstrap is development-only.');
const schema = z.discriminatedUnion('scope', [
  z.object({ scope: z.literal('platform'), email: z.email() }),
  z.object({ scope: z.literal('institution'), email: z.email(), institutionId: z.uuid() }),
]);
const input = schema.safeParse({
  scope: process.env.EDUOS_BOOTSTRAP_SCOPE,
  email: process.env.EDUOS_BOOTSTRAP_EMAIL,
  institutionId: process.env.EDUOS_BOOTSTRAP_INSTITUTION_ID,
});
if (!input.success)
  throw new Error('Configure bootstrap scope, account email and institution ID when required.');
const connection = createDatabase(env.DATABASE_URL);
try {
  const email = input.data.email.toLowerCase();
  if (input.data.scope === 'platform') await bootstrapPlatformOwner(connection.db, email);
  else await bootstrapInstitutionAdmin(connection.db, input.data.institutionId, email);
  console.info('Initial development access granted. Remove temporary bootstrap variables.');
} catch {
  console.error(
    'Access bootstrap failed. Verify existing account/institution and that no active administrator exists.',
  );
  process.exitCode = 1;
} finally {
  await connection.close();
}
