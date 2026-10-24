import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './components/providers/theme-provider';
import { PreviewProvider } from './components/providers/preview-provider';
import { SchoolPreviewProvider } from './components/providers/school-preview-provider';
import { router } from './router';
import { queryClient } from './lib/query-client';
import './styles/globals.css';

const root = document.getElementById('root');
if (!root) throw new Error('Missing application root');
createRoot(root).render(
  <StrictMode>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <PreviewProvider>
          <SchoolPreviewProvider>
            <RouterProvider router={router} />
          </SchoolPreviewProvider>
        </PreviewProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
);
