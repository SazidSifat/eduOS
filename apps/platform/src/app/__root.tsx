import { Card } from '@eduos/ui';
import { createRootRoute, Link, Outlet, redirect, useRouterState } from '@tanstack/react-router';
import { ApiError } from '../lib/api-client';
import { queryClient } from '../lib/query-client';
import { identityQuery, platformAccessQuery } from './_api/platform';
import { PlatformLayout } from '../components/layout/platform-layout';

async function loadPlatformAccess() {
  await queryClient.fetchQuery(identityQuery);
  return queryClient.fetchQuery(platformAccessQuery);
}

async function guardRoute(pathname: string) {
  // Keep sign-in reachable when the API is starting, offline, or misconfigured.
  if (pathname === '/access-denied' || pathname === '/login') return;
  try {
    await loadPlatformAccess();
  } catch (error) {
    if (error instanceof ApiError && error.status === 401)
      throw redirect({ to: '/login', replace: true });
    if (error instanceof ApiError && error.status === 403)
      throw redirect({ to: '/access-denied', replace: true });
    // Fail closed while keeping the authentication screen available for recovery.
    throw redirect({ to: '/login', replace: true });
  }
}

function RootView() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  if (pathname === '/login' || pathname === '/access-denied') return <Outlet />;
  return <PlatformLayout />;
}

export const Route = createRootRoute({
  beforeLoad: ({ location }) => guardRoute(location.pathname),
  component: RootView,
  notFoundComponent: () => (
    <Card as="section" className="space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="text-sm text-muted-foreground">
        The requested platform page could not be found.
      </p>
      <Link to="/" className="text-link text-sm">
        Return to overview
      </Link>
    </Card>
  ),
});
