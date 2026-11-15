import { createApiQueryUtils } from '@movies/api/query-utils';
import type { AppRouterClient } from '@movies/api/router';
import { authClient } from '@native/lib/auth-client';
import { createAuthenticatedFetch } from '@native/lib/auth-transport';
import { serverUrl } from '@native/lib/connections';
import { createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';
import { QueryClient, focusManager, onlineManager } from '@tanstack/react-query';
import { addNetworkStateListener, getNetworkStateAsync, type NetworkState } from 'expo-network';
import { AppState, Platform } from 'react-native';

const client: AppRouterClient = createORPCClient(
  new RPCLink({
    url: `${serverUrl.replace(/\/$/, '')}/rpc`,
    fetch: createAuthenticatedFetch(Platform.OS, authClient.getCookie),
  }),
);
export const orpc = createApiQueryUtils(client);

export const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, retry: 1 } },
});

// Keep refetch-on-focus working when a native app returns from the background.
if (Platform.OS !== 'web') {
  focusManager.setEventListener((setFocused) => {
    const subscription = AppState.addEventListener('change', (state) => {
      setFocused(state === 'active');
    });
    return function cleanup() {
      subscription.remove();
    };
  });
  onlineManager.setEventListener((setOnline) => {
    let useInitialState = true;
    function update(state: NetworkState) {
      setOnline(state.isConnected !== false && state.isInternetReachable !== false);
    }
    const subscription = addNetworkStateListener((state) => {
      useInitialState = false;
      update(state);
    });
    void getNetworkStateAsync()
      .then((state) => {
        if (useInitialState) {
          update(state);
        }
      })
      .catch(() => {
        // Unknown connectivity should permit requests; later events can still report offline.
        if (useInitialState) {
          setOnline(true);
        }
      });
    return function cleanup() {
      useInitialState = false;
      subscription.remove();
    };
  });
}
