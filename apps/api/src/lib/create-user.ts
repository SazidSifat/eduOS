import { createAuth } from '@eduos/auth/server';
import { createDatabase } from '@eduos/database';
import { parseEnv } from '../config/env.js';
import { loginSchema } from '@eduos/contracts';
import { z } from 'zod';
const env = parseEnv(process.env);
if (env.NODE_ENV !== 'development')
  throw new Error('Development user creation is disabled outside development.');
const input = loginSchema.extend({ name: z.string().min(1).max(100) }).safeParse({
  email: process.env.EDUOS_USER_EMAIL,
  password: process.env.EDUOS_USER_PASSWORD,
  name: process.env.EDUOS_USER_NAME,
});
if (!input.success)
  throw new Error(
    'Set EDUOS_USER_EMAIL, EDUOS_USER_NAME and EDUOS_USER_PASSWORD (12-128 characters); use a private environment, not command arguments.',
  );
const connection = createDatabase(env.DATABASE_URL);
try {
  // Public signup remains disabled; internal adapter operations never expose an HTTP registration route.
  const auth = createAuth(connection.db, {
    baseURL: env.AUTH_BASE_URL,
    secret: env.AUTH_SECRET,
    trustedOrigins: env.CORS_TRUSTED_ORIGINS,
    production: false,
  });
  const context = await auth.$context;
  const password = await context.password.hash(input.data.password);
  await connection.transaction(async (tx) => {
    const { user, account } = await import('@eduos/database/schema');
    const id = crypto.randomUUID();
    await tx
      .insert(user)
      .values({ id, name: input.data.name, email: input.data.email.toLowerCase() });
    await tx.insert(account).values({
      id: crypto.randomUUID(),
      accountId: id,
      userId: id,
      providerId: 'credential',
      password,
    });
  });
  console.info('Development account created without institution access.');
} catch {
  console.error('Account creation failed; check configuration and duplicate email.');
  process.exitCode = 1;
} finally {
  await connection.close();
}
