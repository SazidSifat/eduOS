import { describe, it, expect, vi } from 'vitest';
import { createApp } from './create-app.js';
import { parseEnv } from '../config/env.js';
import type { Auth } from '@eduos/auth/server';
const env = parseEnv({
  DATABASE_URL: 'postgresql://test:test@localhost/test',
  REDIS_URL: 'redis://localhost',
  ADMIN_URL: 'http://localhost:5173',
  AUTH_BASE_URL: 'http://localhost:3001',
  AUTH_SECRET: 'a'.repeat(48),
  CORS_TRUSTED_ORIGINS: 'http://localhost:5173',
});
function fixture(authenticated = false, ready = true) {
  const identity = {
    resolver: { resolve: vi.fn(async () => null) },
    listMemberships: vi.fn(async () => []),
    getWorkspace: vi.fn(),
  };
  // Only session lookup is mocked here. Real auth and SQL are covered by the integration suite.
  const auth = {
    api: {
      getSession: vi.fn(async () =>
        authenticated
          ? { user: { id: 'a', name: 'Synthetic user', email: 'test@example.com' } }
          : null,
      ),
    },
    handler: vi.fn(),
  } as unknown as Auth;
  return {
    identity,
    app: createApp({
      env,
      auth,
      identity,
      logger: { write: vi.fn() },
      checkDatabase: async () => {
        if (!ready) throw new Error('private connection string');
      },
    }),
  };
}
describe('HTTP foundation', () => {
  it('health is independent of database readiness', async () => {
    const { app } = fixture(false, false);
    expect((await app.request('/api/health')).status).toBe(200);
    const response = await app.request('/api/ready');
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain('private');
  });
  it('rejects anonymous protected access with a traceable contract', async () => {
    const r = await fixture().app.request('/api/v1/me');
    expect(r.status).toBe(401);
    expect(r.headers.get('x-request-id')).toBeTruthy();
    expect(await r.json()).toMatchObject({ error: { code: 'UNAUTHENTICATED' } });
  });
  it('does not grant CORS credentials to untrusted origins', async () => {
    const r = await fixture().app.request('/api/health', {
      headers: { origin: 'https://evil.example' },
    });
    expect(r.headers.get('access-control-allow-origin')).toBeNull();
  });
  it('allows only configured origins', async () => {
    const r = await fixture().app.request('/api/health', { headers: { origin: env.ADMIN_URL } });
    expect(r.headers.get('access-control-allow-origin')).toBe(env.ADMIN_URL);
  });
  it('rejects malformed tenant IDs before membership queries', async () => {
    const { app, identity } = fixture(true);
    expect((await app.request('/api/v1/institutions/invalid/workspace')).status).toBe(400);
    expect(identity.resolver.resolve).not.toHaveBeenCalled();
  });
  it('rejects forged tenant selection', async () => {
    const { app, identity } = fixture(true);
    expect(
      (await app.request('/api/v1/institutions/00000000-0000-4000-8000-000000000001/workspace'))
        .status,
    ).toBe(403);
    expect(identity.getWorkspace).not.toHaveBeenCalled();
  });
  it('rejects untrusted state changing origins', async () =>
    expect(
      (
        await fixture(true).app.request('/api/v1/memberships', {
          method: 'POST',
          headers: { origin: 'https://evil.example' },
        })
      ).status,
    ).toBe(403));
});
