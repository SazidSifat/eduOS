import { createRouter } from '@tanstack/react-router';
import { routeTree } from '../../routeTree.gen';
import { LoadingState, ErrorState } from '../../components/feedback';
export const router = createRouter({
  routeTree,
  defaultPendingComponent: LoadingState,
  defaultErrorComponent: ({ reset }) => <ErrorState retry={reset} />,
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
});
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
