import { createFileRoute } from '@tanstack/react-router';
import { OverviewPage } from './_component/overview-page';

function Page() {
  return <OverviewPage />;
}
export const Route = createFileRoute('/')({ component: Page });
