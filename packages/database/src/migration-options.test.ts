import { expect, it } from 'vitest';
import { migrationFailureMessage, parseMigrationOptions } from './migration-options.js';

const url = 'postgresql://localhost/eduos_test_migrations';

it('selects explicit apply or connectivity-only mode', () => {
  expect(parseMigrationOptions({ DATABASE_URL: url }, [])).toEqual({ url, checkOnly: false });
  expect(parseMigrationOptions({ DATABASE_URL: url }, ['--check'])).toEqual({
    url,
    checkOnly: true,
  });
});

it.each([{}, { DATABASE_URL: 'https://localhost/eduos_test_migrations' }, { DATABASE_URL: 123 }])(
  'rejects missing or non-PostgreSQL configuration',
  (environment) =>
    expect(() => parseMigrationOptions(environment, [])).toThrow(/PostgreSQL DATABASE_URL/),
);

it('does not include invalid configuration values in errors', () => {
  const privateValue = `invalid-${crypto.randomUUID()}`;
  try {
    parseMigrationOptions({ DATABASE_URL: privateValue }, []);
    throw new Error('Expected invalid configuration to fail');
  } catch (error) {
    expect(String(error)).not.toContain(privateValue);
    expect(String(error)).toContain('PostgreSQL DATABASE_URL');
  }
});

it('refuses unsupported and repeated flags', () => {
  expect(() => parseMigrationOptions({ DATABASE_URL: url }, ['--reset'])).toThrow(/Usage/);
  expect(() => parseMigrationOptions({ DATABASE_URL: url }, ['--check', '--check'])).toThrow(
    /Usage/,
  );
});

it('reports nested database authentication failures without exposing driver details', () => {
  const privateValue = crypto.randomUUID();
  const error = { message: privateValue, cause: { code: '28P01', detail: privateValue } };
  expect(migrationFailureMessage(error)).toContain('Database authentication failed');
  expect(migrationFailureMessage(error)).not.toContain(privateValue);
});

it('does not reflect unknown database errors or arbitrary codes', () => {
  const privateValue = crypto.randomUUID();
  expect(migrationFailureMessage({ code: privateValue, message: privateValue })).not.toContain(
    privateValue,
  );
  expect(migrationFailureMessage(null)).toContain('No reset was performed');
});

it('bounds cyclic error causes', () => {
  const error: { cause?: unknown } = {};
  error.cause = error;
  expect(migrationFailureMessage(error)).toContain('No reset was performed');
});
