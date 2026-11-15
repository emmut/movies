'use client';

import { createContext, useContext, type ReactNode } from 'react';

import type { createApiQueryUtils } from '../query-utils';

type ApiQueryUtils = ReturnType<typeof createApiQueryUtils>;
const AccountContext = createContext<string | null | undefined>(undefined);
export function useApiAccountId() {
  return useContext(AccountContext) ?? null;
}

const ApiContext = createContext<ApiQueryUtils | null>(null);
export function ApiProvider({
  api,
  accountId,
  children,
}: {
  api: ApiQueryUtils;
  accountId?: string | null;
  children: ReactNode;
}) {
  return (
    <ApiContext.Provider value={api}>
      <AccountContext.Provider value={accountId}>{children}</AccountContext.Provider>
    </ApiContext.Provider>
  );
}
export function useApi(): ApiQueryUtils {
  const api = useContext(ApiContext);
  if (!api) {
    throw new Error('API hooks require ApiProvider');
  }
  return api;
}

export function useEffectiveAccountId(fallback: string | null) {
  const accountId = useContext(AccountContext);
  if (accountId === undefined) {
    return fallback;
  }
  return accountId;
}
