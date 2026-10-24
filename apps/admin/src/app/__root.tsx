import { createRootRoute } from '@tanstack/react-router';
import { RootLayout } from './layout';
export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: () => <p>Page not found.</p>,
});
