import { createFileRoute } from '@tanstack/react-router';
import { CollectionReport } from '../_component/collection-report';

function Page() {
  return <CollectionReport />;
}

export const Route = createFileRoute('/_school/fees/report/')({
  component: Page,
});
