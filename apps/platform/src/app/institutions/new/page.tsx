import { createFileRoute } from '@tanstack/react-router';
import { CreateSchoolPage } from './_component/create-school-page';
function Page() {
  return <CreateSchoolPage />;
}
export const Route = createFileRoute('/institutions/new/')({ component: Page });
