import { beforeEach, expect, it, vi } from 'vitest';
import { isRedirect } from '@tanstack/react-router';
import { ApiError } from '../../../lib/api-client';
import { redirectAuthenticatedUser, requireIdentity } from './session';

const fetchQuery = vi.hoisted(() => vi.fn());
vi.mock('../../../lib/config', () => ({
  config: { VITE_API_BASE_URL: 'http://localhost:3001' },
}));
vi.mock('../../../lib/query-client', () => ({ queryClient: { fetchQuery } }));
beforeEach(() => vi.resetAllMocks());

it('allows signed-out users to see login', async () => {
  fetchQuery.mockRejectedValue(new ApiError(401));
  await expect(redirectAuthenticatedUser()).resolves.toBeUndefined();
});

it('redirects an authenticated user from login to the application', async () => {
  fetchQuery.mockResolvedValue({ id: 'synthetic-user' });
  try {
    await redirectAuthenticatedUser();
    throw new Error('Expected an authenticated redirect');
  } catch (error) {
    expect(isRedirect(error)).toBe(true);
    if (!isRedirect(error)) throw error;
    expect(error.options.to).toBe('/app');
    expect(error.options.replace).toBe(true);
  }
});

it('redirects a revoked session to login when entering the workspace', async () => {
  fetchQuery.mockRejectedValue(new ApiError(401));
  try {
    await requireIdentity();
    throw new Error('Expected a sign-in redirect');
  } catch (error) {
    expect(isRedirect(error)).toBe(true);
    if (!isRedirect(error)) throw error;
    expect(error.options.to).toBe('/login');
  }
});

it('returns the server-validated identity for a protected route', async () => {
  const identity = { id: 'synthetic-user' };
  fetchQuery.mockResolvedValue(identity);
  await expect(requireIdentity()).resolves.toBe(identity);
});

it.each([new ApiError(403), new ApiError(500), new TypeError('Failed to fetch')])(
  'keeps non-session errors visible instead of redirecting in a loop: %s',
  async (error) => {
    fetchQuery.mockRejectedValue(error);
    await expect(redirectAuthenticatedUser()).rejects.toBe(error);
    await expect(requireIdentity()).rejects.toBe(error);
  },
);
