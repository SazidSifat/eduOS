import { createFileRoute } from '@tanstack/react-router';
import { MessagesPage } from './_component/messages-page';
function Page() {
  return <MessagesPage />;
}
export const Route = createFileRoute('/messages/')({ component: Page });
