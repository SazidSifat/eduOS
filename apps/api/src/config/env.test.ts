import { it, expect } from 'vitest';
import { parseEnv } from './env.js';
const input = {
  DATABASE_URL: 'postgresql://test:test@localhost/test',
  REDIS_URL: 'redis://localhost',
  ADMIN_URL: 'http://localhost:5173',
  AUTH_BASE_URL: 'http://localhost:3001',
  AUTH_SECRET: 'a'.repeat(48),
  CORS_TRUSTED_ORIGINS: 'http://localhost:5173',
};
it('fails closed when the secret is missing', () =>
  expect(() => parseEnv({ ...input, AUTH_SECRET: undefined })).toThrow());
it('requires HTTPS for production origins', () =>
  expect(() => parseEnv({ ...input, NODE_ENV: 'production' })).toThrow());
it('does not include a rejected secret value in errors', () => {
  const secret = 'private-value';
  try {
    parseEnv({ ...input, AUTH_SECRET: secret });
  } catch (error) {
    expect(String(error)).not.toContain(secret);
  }
});
it('parses exact trusted origins', () =>
  expect(parseEnv(input).CORS_TRUSTED_ORIGINS).toEqual(['http://localhost:5173']));
