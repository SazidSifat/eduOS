import { createFileRoute } from '@tanstack/react-router';
import { requireApplicationEntry } from './_api/entry';
import { SchoolChooser } from './_component/school-chooser';
function Page() {
  return <SchoolChooser userId={Route.useRouteContext().identity.id} />;
}
export const Route = createFileRoute('/app/')({
  beforeLoad: requireApplicationEntry,
  component: Page,
});
