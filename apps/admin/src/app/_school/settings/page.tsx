import { createFileRoute } from '@tanstack/react-router';
import { SettingsOverview } from './_component/settings-overview';

function Page() {
  return <SettingsOverview />;
}

export const Route = createFileRoute('/_school/settings/')({
  component: Page,
});
