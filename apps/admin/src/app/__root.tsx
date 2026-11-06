import { useLanguage } from '@eduos/ui';
import { createRootRoute } from '@tanstack/react-router';
import { RootLayout } from '../components/layout/root-layout';
export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: function NotFoundPage() {
    const { t } = useLanguage();
    return (
      <main id="main-content" tabIndex={-1} className="p-8">
        <h1 className="text-2xl font-semibold">{t('Page not found.')}</h1>
      </main>
    );
  },
});
