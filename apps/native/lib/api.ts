import type { AppRouterClient } from '@movies/api/router';
import { createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';
import { createTanstackQueryUtils } from '@orpc/tanstack-query';
import { QueryClient, focusManager, onlineManager } from '@tanstack/react-query';
import { AppState, Platform } from 'react-native';

import { serverUrl } from './connections';
const client: AppRouterClient = createORPCClient(
  new RPCLink({ url: `${serverUrl.replace(/\/$/, '')}/rpc` }),
);
export const orpc = createTanstackQueryUtils(client);
export const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, retry: 1 } },
});

// Keep refetch-on-focus working when a native app returns from the background.
focusManager.setEventListener((setFocused) => {
  const subscription = AppState.addEventListener('change', (state) => {
    if (Platform.OS !== 'web') setFocused(state === 'active');
  });
  return function cleanup() {
    subscription.remove();
  };
});
// Native requests retry normally; browser connectivity is tracked by React Query.
if (Platform.OS !== 'web') onlineManager.setOnline(true);
