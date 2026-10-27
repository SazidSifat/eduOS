import { createFileRoute } from '@tanstack/react-router';
import { FeeSettings } from '../_component/fee-settings';

function Page() {
  return <FeeSettings />;
}

export const Route = createFileRoute('/_school/settings/fees/')({
  component: Page,
});
