import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './components/providers/theme-provider';
import { PlatformAccessProvider } from './components/providers/platform-access-provider';
import { router } from './router';
import { queryClient } from './lib/query-client';
import './styles/globals.css';

const root = document.getElementById('root');
if (!root) throw new Error('Missing application root');
createRoot(root).render(
  <StrictMode>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <PlatformAccessProvider>
          <RouterProvider router={router} />
        </PlatformAccessProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
);
