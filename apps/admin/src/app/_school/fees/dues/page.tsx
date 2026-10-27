import { createFileRoute } from '@tanstack/react-router';
import { FeeDirectory } from '../_component/fee-directory';

function Page() {
  return <FeeDirectory dues />;
}

export const Route = createFileRoute('/_school/fees/dues/')({
  component: Page,
});
