import { createFileRoute, Outlet } from '@tanstack/react-router';
import { requireIdentity } from '../../../login/_api/session';
import { InstitutionShell } from '../../../../components/layout/institution-shell';

function Layout() {
  const { institutionId } = Route.useParams();
  return (
    <InstitutionShell institutionId={institutionId}>
      <Outlet />
    </InstitutionShell>
  );
}

export const Route = createFileRoute('/institutions/$institutionId/settings')({
  beforeLoad: requireIdentity,
  component: Layout,
});
