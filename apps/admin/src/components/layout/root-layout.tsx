import { Outlet } from '@tanstack/react-router';

export function RootLayout() {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:z-50 focus:bg-background focus:p-3"
      >
        Skip to content
      </a>
      <Outlet />
    </>
  );
}
