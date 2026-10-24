import { z } from 'zod';
const origin = z.url().refine((value) => {
  const u = new URL(value);
  return ['http:', 'https:'].includes(u.protocol) && u.origin === value;
}, 'Use an exact HTTP(S) origin without trailing slash');
const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    API_PORT: z.coerce.number().int().min(1).max(65535).default(3001),
    DATABASE_URL: z
      .url()
      .refine((v) => v.startsWith('postgresql://') || v.startsWith('postgres://')),
    REDIS_URL: z.url().refine((v) => v.startsWith('redis://') || v.startsWith('rediss://')),
    ADMIN_URL: origin,
    AUTH_BASE_URL: origin,
    AUTH_SECRET: z
      .string()
      .min(32)
      .refine((v) => !v.includes('REPLACE_')),
    CORS_TRUSTED_ORIGINS: z
      .string()
      .transform((v) => v.split(',').map((s) => s.trim()))
      .pipe(z.array(origin).min(1)),
    LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error', 'silent']).default('info'),
  })
  .superRefine((env, ctx) => {
    if (!env.CORS_TRUSTED_ORIGINS.includes(env.ADMIN_URL))
      ctx.addIssue({
        code: 'custom',
        path: ['CORS_TRUSTED_ORIGINS'],
        message: 'Must include ADMIN_URL',
      });
    if (
      env.NODE_ENV === 'production' &&
      [env.ADMIN_URL, env.AUTH_BASE_URL, ...env.CORS_TRUSTED_ORIGINS].some(
        (v) => !v.startsWith('https://'),
      )
    )
      ctx.addIssue({
        code: 'custom',
        path: ['AUTH_BASE_URL'],
        message: 'Production origins require HTTPS',
      });
  });
export function parseEnv(input: Record<string, unknown>) {
  const result = envSchema.safeParse(input);
  if (!result.success)
    throw new Error(
      `Invalid environment: ${result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`,
    );
  return result.data;
}
export type ApiEnv = ReturnType<typeof parseEnv>;
