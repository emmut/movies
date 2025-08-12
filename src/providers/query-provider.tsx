'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ReactNode, useState } from 'react';

/**
 * QueryProvider component that provides TanStack Query functionality to the app.
 *
 * Sets up the QueryClient with optimized defaults for SSR and creates a provider
 * that makes the client accessible throughout the component tree. Includes
 * development tools for debugging queries in development mode.
 */
function QueryProvider({ children }: { children: ReactNode }) {
  // Create QueryClient with SSR-optimized defaults
  // Using useState to ensure client is only created once per component instance
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Set staleTime above 0 to avoid immediate refetching on client
            // This is especially important for SSR to prevent hydration issues
            staleTime: 60 * 1000, // 1 minute
            // Reduce retry attempts for better UX
            retry: 2,
            // Configure refetch behavior
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
          },
          mutations: {
            // Configure mutation retry behavior
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Only show devtools in development */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools
          initialIsOpen={false}
          buttonPosition="bottom-left"
          position="bottom"
        />
      )}
    </QueryClientProvider>
  );
}

export { QueryProvider };

