import { createFileRoute } from '@tanstack/react-router';
import { CreateInstitutionPage } from './_component/create-institution-page';
function Page() {
  return <CreateInstitutionPage />;
}
export const Route = createFileRoute('/institutions/new/')({ component: Page });
