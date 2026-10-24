import { createRouter, useRouter } from '@tanstack/react-router';
import { Card, Button } from '@eduos/ui';
import { routeTree } from './routeTree.gen';

function RouteError() {
  const activeRouter = useRouter();
  return (
    <Card as="section" className="space-y-4 p-6" role="alert">
      <h1 className="text-2xl font-semibold">Unable to open this view</h1>
      <p className="text-sm text-muted-foreground">Try loading the platform again.</p>
      <Button
        onClick={() => {
          void activeRouter.invalidate();
        }}
      >
        Try again
      </Button>
    </Card>
  );
}
export const router = createRouter({
  routeTree,
  scrollRestoration: true,
  defaultPreload: 'intent',
  defaultPendingComponent: () => (
    <output className="text-sm text-muted-foreground">Loading platform…</output>
  ),
  defaultErrorComponent: RouteError,
});
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
