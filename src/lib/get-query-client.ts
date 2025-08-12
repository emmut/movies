import { QueryClient } from '@tanstack/react-query';
import { cache } from 'react';

/**
 * Creates and caches a QueryClient instance for React Server Components.
 *
 * Uses React's cache() function to ensure a single QueryClient per request,
 * preventing data leakage between different server requests.
 */
const getQueryClient = cache(
  () =>
    new QueryClient({
      defaultOptions: {
        queries: {
          // With SSR, set staleTime above 0 to avoid immediate refetching on client
          staleTime: 60 * 1000, // 1 minute
        },
      },
    })
);

export default getQueryClient;

