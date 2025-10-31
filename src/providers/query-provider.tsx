'use client';

import { getQueryClient } from '@/lib/query-client';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ReactNode } from 'react';

type QueryProviderProps = {
  children: ReactNode;
};

/**
 * Provides React Query context to the application.
 *
 * Wraps the application with QueryClientProvider to enable React Query hooks throughout the component tree.
 * Includes React Query DevTools in development for debugging and monitoring queries.
 *
 * @param children - The child components to wrap with the query provider
 */
export function QueryProvider({ children }: QueryProviderProps) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
