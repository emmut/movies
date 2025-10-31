import { QueryClient } from '@tanstack/react-query';

/**
 * Creates a new QueryClient instance with optimized configuration for Next.js App Router.
 *
 * Configuration:
 * - staleTime: 60 seconds - Data is considered fresh for 1 minute
 * - gcTime: 5 minutes - Unused data is garbage collected after 5 minutes
 * - refetchOnWindowFocus: false - Prevents unnecessary refetches when window regains focus
 * - retry: 1 - Retries failed requests once before showing error
 *
 * @returns A configured QueryClient instance
 */
export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        gcTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

/**
 * Gets or creates a QueryClient instance for the browser.
 * Ensures a single QueryClient instance is used throughout the client-side application.
 *
 * @returns The browser QueryClient instance
 */
export function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always create a new QueryClient
    return makeQueryClient();
  } else {
    // Browser: create QueryClient if it doesn't exist yet
    if (!browserQueryClient) {
      browserQueryClient = makeQueryClient();
    }
    return browserQueryClient;
  }
}
