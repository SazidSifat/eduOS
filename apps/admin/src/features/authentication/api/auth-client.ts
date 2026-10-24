import { createAuthClient } from '@eduos/auth/client';
import { config } from '../../../lib/config';
export const authClient = createAuthClient({
  baseURL: config.VITE_AUTH_BASE_URL,
  basePath: '/api/auth',
  fetchOptions: { credentials: 'include' },
});
