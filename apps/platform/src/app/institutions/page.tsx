import { createFileRoute } from '@tanstack/react-router';
import { InstitutionsPage } from './_component/institutions-page';

function Page() {
  return <InstitutionsPage />;
}
export const Route = createFileRoute('/institutions/')({ component: Page });
