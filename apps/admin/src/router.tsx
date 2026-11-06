import { useLanguage } from '@eduos/ui';
import { createRouter, useRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';
import { LoadingState, ErrorState } from './components/feedback';

function RouteError() {
  const activeRouter = useRouter();
  return (
    <main id="main-content" tabIndex={-1} className="mx-auto max-w-5xl px-6 py-12">
      <ErrorState
        retry={() => {
          void activeRouter.invalidate();
        }}
      />
    </main>
  );
}

export const router = createRouter({
  routeTree,
  defaultPendingComponent: function RoutePending() {
    const { t } = useLanguage();
    return (
      <main id="main-content" tabIndex={-1} className="mx-auto max-w-5xl px-6 py-12">
        <LoadingState label={t('Checking your session…')} />
      </main>
    );
  },
  defaultErrorComponent: RouteError,
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
});
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
