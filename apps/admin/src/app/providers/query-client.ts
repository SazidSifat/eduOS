import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '../../lib/api-client';
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      retry: (count, error) => !(error instanceof ApiError && error.status < 500) && count < 1,
      refetchOnWindowFocus: true,
    },
  },
});
