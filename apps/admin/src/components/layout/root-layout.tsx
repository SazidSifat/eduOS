import { useLanguage } from '@eduos/ui';
import { Outlet } from '@tanstack/react-router';

export function RootLayout() {
  const { t } = useLanguage();

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:z-50 focus:bg-background focus:p-3"
      >
        {t('Skip to content')}{' '}
      </a>
      <Outlet />
    </>
  );
}
