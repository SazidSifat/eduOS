import { createFileRoute, Outlet } from '@tanstack/react-router';
import { requireIdentity } from '../../../login/_api/session';
import { AdmissionsShell } from './_component/admissions-shell';
function Layout() {
  const { institutionId } = Route.useParams();
  return (
    <AdmissionsShell institutionId={institutionId}>
      <Outlet />
    </AdmissionsShell>
  );
}
export const Route = createFileRoute('/institutions/$institutionId/admissions')({
  beforeLoad: requireIdentity,
  component: Layout,
});
