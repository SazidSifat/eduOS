import { createAuth } from '@eduos/auth/server';
import { createDatabase } from '@eduos/database';
import { parseEnv } from '../config/env.js';
import {
  provisionDevelopmentUser,
  provisionUserSchema,
} from '../services/identity/provision-user.js';
const env = parseEnv(process.env);
if (env.NODE_ENV !== 'development')
  throw new Error('Development user creation is disabled outside development.');
const input = provisionUserSchema.safeParse({
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
  const result = await provisionDevelopmentUser(connection.db, input.data, (password) =>
    context.password.hash(password),
  );
  console.info(
    result === 'created'
      ? 'Development account created without institution access.'
      : 'Account already exists. Existing credentials, profile and access were preserved.',
  );
} catch {
  console.error('Account creation failed; check database configuration and applied migrations.');
  process.exitCode = 1;
} finally {
  await connection.close();
}
