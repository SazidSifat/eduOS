import { redirect } from '@tanstack/react-router';
import { requireIdentity } from '../../../login/_api/session';
import { queryClient } from '../../../../lib/query-client';
import { schoolAccessQuery, workspaceQuery } from './queries';
export async function requireSchoolApplication({ params }: { params: { institutionId: string } }) {
  const identity = await requireIdentity();
  const access = await queryClient.fetchQuery(schoolAccessQuery(identity.id, params.institutionId));
  if (access.permissions.includes('admissions.read') && access.modules.includes('admissions')) {
    throw redirect({
      to: '/institutions/$institutionId/admissions',
      params,
      search: { state: 'follow_up', due: 'all', search: '', offset: 0 },
      replace: true,
    });
  }
  const workspace = await queryClient.fetchQuery(workspaceQuery(identity.id, params.institutionId));
  return { identity, workspace };
}
