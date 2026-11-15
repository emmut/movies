'use client';

import { ApiProvider } from '@movies/api/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import type { ReactNode } from 'react';

import { PreferenceRefresh } from '@/components/preference-refresh';
import { api } from '@/lib/api-client';
import { useSession } from '@/lib/auth-client';
import { getQueryClient } from '@/lib/query-client';

type QueryProviderProps = {
  children: ReactNode;
};

/** `undefined` while the session resolves; `null` once the visitor is known to be signed out. */
function accountIdFromSession(session: ReturnType<typeof useSession>) {
  if (session.isPending) {
    return undefined;
  }
  return session.data?.user.id ?? null;
}

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
  const session = useSession();

  return (
    <QueryClientProvider client={queryClient}>
      <ApiProvider api={api} accountId={accountIdFromSession(session)}>
        <PreferenceRefresh />
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
      </ApiProvider>
    </QueryClientProvider>
  );
}
