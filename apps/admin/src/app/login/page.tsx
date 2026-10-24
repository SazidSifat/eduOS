import { createFileRoute } from '@tanstack/react-router';
import { LoginPage } from './_component/login-page';
import { redirectAuthenticatedUser } from './-api/session';

function Page() {
  return <LoginPage />;
}

export const Route = createFileRoute('/login/')({
  beforeLoad: redirectAuthenticatedUser,
  component: Page,
});
