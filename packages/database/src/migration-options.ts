import { z } from 'zod';

const environmentSchema = z.object({
  DATABASE_URL: z.url().refine((value) => /^postgres(?:ql)?:\/\//.test(value)),
});
const argumentsSchema = z.array(z.literal('--check')).max(1);

export function parseMigrationOptions(environment: unknown, args: readonly string[]) {
  const config = environmentSchema.safeParse(environment);
  if (!config.success)
    throw new Error('Set a PostgreSQL DATABASE_URL in apps/api/.env or the shell environment.');
  const options = argumentsSchema.safeParse(args);
  if (!options.success) throw new Error('Usage: pnpm db:migrate or pnpm db:migrate:check.');
  return { url: config.data.DATABASE_URL, checkOnly: options.data.includes('--check') };
}

const failures: Record<string, string> = {
  '28P01': 'Database authentication failed. Check the configured database username and password.',
  '28000': 'Database access was denied. Check the database role and authentication configuration.',
  '3D000': 'The configured database does not exist. Create it before running migrations.',
  '42501': 'The database role lacks migration permissions. Use an authorized migration role.',
  '42P07':
    'Existing tables conflict with migration history. Review the schema and journal before retrying.',
  '42710':
    'Existing objects conflict with migration history. Review the schema and journal before retrying.',
  ECONNREFUSED: 'The database is not accepting connections. Check the configured host and port.',
  ENOTFOUND: 'The database hostname could not be resolved. Check the configured host.',
  EAI_AGAIN: 'The database hostname could not be resolved. Retry after network access is restored.',
  EPERM: 'Database access was blocked by environment permissions.',
};

export function migrationFailureMessage(error: unknown): string {
  let current = error;
  // Drizzle wraps driver errors in cause. Never render raw errors, SQL or connection URLs.
  for (let depth = 0; depth < 5; depth++) {
    if (typeof current !== 'object' || current === null) break;
    if (
      'code' in current &&
      typeof current.code === 'string' &&
      Object.hasOwn(failures, current.code)
    ) {
      const message = failures[current.code];
      if (message) return message;
    }
    current = 'cause' in current ? current.cause : undefined;
  }
  return 'Check database availability and review the committed migrations. No reset was performed.';
}
