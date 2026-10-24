import { createFileRoute } from '@tanstack/react-router';
import { OperatorsPage } from './_component/operators-page';

function Page() {
  return <OperatorsPage />;
}
export const Route = createFileRoute('/operators/')({ component: Page });
