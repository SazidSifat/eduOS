import { createFileRoute } from '@tanstack/react-router';
import { SubscriptionsPage } from './_component/subscriptions-page';
function Page() {
  return <SubscriptionsPage />;
}
export const Route = createFileRoute('/subscriptions/')({ component: Page });
