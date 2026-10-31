import { redirect } from '@tanstack/react-router';
import { requireIdentity } from '../../login/_api/session';
import { membershipsQuery } from '../../institutions/$institutionId/_api/queries';
import { queryClient } from '../../../lib/query-client';

export async function requireApplicationEntry() {
  const identity = await requireIdentity();
  const memberships = await queryClient.fetchQuery(membershipsQuery(identity.id));
  const schools = memberships.filter((membership) => membership.role !== null);
  if (schools.length === 1) {
    const school = schools[0];
    if (school)
      throw redirect({
        to:
          school.role === 'teacher'
            ? '/attendance'
            : school.role === 'accountant'
              ? '/fees'
              : '/admissions',
        search: { institutionId: school.institutionId },
        replace: true,
      });
  }
  return { identity };
}
