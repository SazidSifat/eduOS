import { createRootRoute } from '@tanstack/react-router';
import { RootLayout } from '../components/layout/root-layout';
export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: () => (
    <main id="main-content" tabIndex={-1} className="p-8">
      <h1 className="text-2xl font-semibold">Page not found.</h1>
    </main>
  ),
});
