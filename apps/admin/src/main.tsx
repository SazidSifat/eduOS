import { bangla } from './lib/i18n/translations';
import { LanguageProvider } from '@eduos/ui';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { ErrorBoundary } from './components/error-boundary';
import { ThemeProvider } from './components/providers/theme-provider';
import { queryClient } from './lib/query-client';
import { router } from './router';
import './styles/globals.css';
const root = document.getElementById('root');
if (!root) throw new Error('Missing application root');
createRoot(root).render(
  <StrictMode>
    <LanguageProvider defaultLanguage="bn" translations={bangla}>
      <ErrorBoundary>
        <ThemeProvider>
          <QueryClientProvider client={queryClient}>
            <RouterProvider router={router} />
          </QueryClientProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </LanguageProvider>
  </StrictMode>,
);
