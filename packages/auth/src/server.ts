import { randomUUID } from 'node:crypto';
import type { Auth as BetterAuthInstance } from 'better-auth';
import { betterAuth, type BetterAuthOptions } from 'better-auth/minimal';
import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import type { Database } from '@eduos/database';
import * as schema from '@eduos/database/schema';
export interface AuthConfiguration {
  baseURL: string;
  secret: string;
  trustedOrigins: string[];
  production: boolean;
}
export function createAuth(db: Database, config: AuthConfiguration): BetterAuthInstance {
  return betterAuth<BetterAuthOptions>({
    appName: 'EduOS',
    baseURL: config.baseURL,
    basePath: '/api/auth',
    secret: config.secret,
    trustedOrigins: config.trustedOrigins,
    database: drizzleAdapter(db, { provider: 'pg', schema }),
    emailAndPassword: {
      enabled: true,
      disableSignUp: true,
      minPasswordLength: 12,
      maxPasswordLength: 128,
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
      cookieCache: { enabled: false },
    },
    advanced: {
      useSecureCookies: config.production,
      defaultCookieAttributes: { httpOnly: true, sameSite: 'lax', secure: config.production },
      database: { generateId: () => randomUUID() },
      ipAddress: { ipAddressHeaders: ['x-eduos-client-ip'] },
    },
    rateLimit: {
      enabled: true,
      storage: 'database',
      window: 60,
      max: 60,
      customRules: { '/sign-in/email': { window: 60, max: 5 } },
    },
    // Database/framework errors can contain secrets: application logs sanitized event codes.
    logger: { disabled: true },
  });
}
export type Auth = ReturnType<typeof createAuth>;

export { hashPassword } from 'better-auth/crypto';
