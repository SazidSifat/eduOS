import { beforeEach, expect, it, vi } from 'vitest';
import { isRedirect } from '@tanstack/react-router';
import { ApiError } from '../../../lib/api-client';
import { requireApplicationEntry } from './entry';
import { requireSchoolApplication } from '../../institutions/$institutionId/_api/entry';
const { fetchQuery, requireIdentity } = vi.hoisted(() => ({
  fetchQuery: vi.fn(),
  requireIdentity: vi.fn(),
}));
vi.mock('../../../lib/query-client', () => ({ queryClient: { fetchQuery } }));
vi.mock('../../../lib/config', () => ({ config: { VITE_API_BASE_URL: 'http://localhost:3001' } }));
vi.mock('../../login/_api/session', () => ({ requireIdentity }));
const identity = {
  id: '20000000-0000-4000-8000-000000000001',
  name: 'Synthetic Admin',
  email: 'admin@example.test',
};
const institutionId = '10000000-0000-4000-8000-000000000001';
const membership = { institutionId, code: '123456', name: 'Synthetic School', role: 'admin' };
beforeEach(() => {
  vi.resetAllMocks();
  requireIdentity.mockResolvedValue(identity);
});
async function expectDestination(action: () => Promise<unknown>, to: string, id?: string) {
  try {
    await action();
    throw new Error('Expected a route redirect');
  } catch (error) {
    if (!isRedirect(error)) throw error;
    expect(error.options.to).toBe(to);
    expect(error.options.replace).toBe(true);
    if (id)
      expect(to.startsWith('/institutions') ? error.options.params : error.options.search).toEqual({
        institutionId: id,
      });
  }
}
it('opens the only assigned school directly and ignores unassigned memberships', async () => {
  fetchQuery.mockResolvedValue([
    membership,
    { ...membership, institutionId: '10000000-0000-4000-8000-000000000002', role: null },
  ]);
  await expectDestination(requireApplicationEntry, '/admissions', institutionId);
});
it('keeps a chooser when more than one school role is assigned', async () => {
  fetchQuery.mockResolvedValue([
    membership,
    { ...membership, institutionId: '10000000-0000-4000-8000-000000000002' },
  ]);
  await expect(requireApplicationEntry()).resolves.toEqual({ identity });
});
it.each([{ memberships: [] }, { memberships: [{ ...membership, role: null }] }])(
  'keeps accounts with no school role on the access explanation',
  async ({ memberships }) => {
    fetchQuery.mockResolvedValue(memberships);
    await expect(requireApplicationEntry()).resolves.toEqual({ identity });
  },
);
it('opens admissions only with both its permission and module entitlement', async () => {
  fetchQuery.mockResolvedValue({ permissions: ['admissions.read'], modules: ['admissions'] });
  await expectDestination(
    () => requireSchoolApplication({ params: { institutionId } }),
    '/institutions/$institutionId/admissions',
    institutionId,
  );
});
it.each([
  { permissions: ['workspace.read'], modules: ['admissions'] },
  { permissions: ['workspace.read', 'admissions.read'], modules: [] },
])('shows school access status instead of routing into an unavailable module', async (access) => {
  const workspace = { name: 'Synthetic School', institutionId };
  fetchQuery.mockResolvedValueOnce(access).mockResolvedValueOnce(workspace);
  await expect(requireSchoolApplication({ params: { institutionId } })).resolves.toEqual({
    identity,
    workspace,
  });
});
it.each([new ApiError(403), new ApiError(500), new TypeError('Failed to fetch')])(
  'does not hide denied or failed school access: %s',
  async (error) => {
    fetchQuery.mockRejectedValue(error);
    await expect(requireApplicationEntry()).rejects.toBe(error);
    await expect(requireSchoolApplication({ params: { institutionId } })).rejects.toBe(error);
  },
);

it.each([
  ['teacher', '/attendance'],
  ['accountant', '/fees'],
] as const)('opens the %s school home', async (role, to) => {
  fetchQuery.mockResolvedValue([{ ...membership, role }]);
  await expectDestination(requireApplicationEntry, to, institutionId);
});
