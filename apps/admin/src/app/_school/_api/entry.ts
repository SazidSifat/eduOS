import { redirect } from '@tanstack/react-router';
import { requireIdentity } from '../../login/_api/session';
import { membershipsQuery } from '../../institutions/$institutionId/_api/queries';
import { queryClient } from '../../../lib/query-client';
export async function requireSchoolEntry(institutionId: string | undefined) {
  const identity = await requireIdentity();
  const memberships = await queryClient.fetchQuery(membershipsQuery(identity.id));
  const schools = memberships.filter((s) => s.role !== null);
  const school = institutionId
    ? schools.find((s) => s.institutionId === institutionId)
    : schools.length === 1
      ? schools[0]
      : undefined;
  if (!school) throw redirect({ to: '/app', replace: true });
  return { identity, institutionId: school.institutionId };
}
