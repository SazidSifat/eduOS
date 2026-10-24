import { createFileRoute } from '@tanstack/react-router';
import { LoginPage } from './_component/login-page';
import { redirectAuthenticatedUser } from './_api/session';
import { LoginError, LoginPending } from './_component/login-feedback';

function Page() {
  return <LoginPage />;
}

function Pending() {
  return <LoginPending />;
}

function ErrorPage() {
  return <LoginError />;
}

export const Route = createFileRoute('/login/')({
  beforeLoad: redirectAuthenticatedUser,
  component: Page,
  pendingComponent: Pending,
  errorComponent: ErrorPage,
});
