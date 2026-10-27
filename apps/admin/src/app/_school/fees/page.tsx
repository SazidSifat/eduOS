import { createFileRoute } from '@tanstack/react-router';
import { FeeDirectory } from './_component/fee-directory';

function Page() {
  return <FeeDirectory />;
}

export const Route = createFileRoute('/_school/fees/')({
  component: Page,
});
