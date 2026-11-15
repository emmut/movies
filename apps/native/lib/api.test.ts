import { QueryObserver, focusManager, onlineManager } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

const native = vi.hoisted(() => ({
  platform: 'web',
  remove: vi.fn(),
  addListener: vi.fn(),
  addNetworkListener: vi.fn(),
  networkState: vi.fn(),
  removeNetwork: vi.fn(),
}));
vi.mock('@native/lib/auth-client', () => ({ authClient: { getCookie: async () => '' } }));
vi.mock('@native/lib/connections', () => ({ serverUrl: 'http://localhost:3001' }));
vi.mock('expo-network', () => ({
  addNetworkStateListener: native.addNetworkListener,
  getNetworkStateAsync: native.networkState,
}));
vi.mock('react-native', () => ({
  Platform: {
    get OS() {
      return native.platform;
    },
  },
  AppState: { addEventListener: native.addListener },
}));

beforeEach(() => {
  native.addListener.mockReturnValue({ remove: native.remove });
  native.addNetworkListener.mockReturnValue({ remove: native.removeNetwork });
  native.networkState.mockResolvedValue({ isConnected: true });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
  native.addListener.mockReset();
  native.remove.mockReset();
  native.addNetworkListener.mockReset();
  native.networkState.mockReset();
  native.removeNetwork.mockReset();
  onlineManager.setOnline(true);
});

describe('query focus integration', () => {
  it('preserves the browser focus and connectivity listeners', async () => {
    native.platform = 'web';
    const focus = vi.spyOn(focusManager, 'setEventListener');
    const online = vi.spyOn(onlineManager, 'setEventListener');
    await import('@native/lib/api');
    expect(focus).not.toHaveBeenCalled();
    expect(online).not.toHaveBeenCalled();
    expect(native.addListener).not.toHaveBeenCalled();
    expect(native.addNetworkListener).not.toHaveBeenCalled();
    expect(native.networkState).not.toHaveBeenCalled();
  });
  it('tracks native foreground changes and removes its subscription', async () => {
    native.platform = 'ios';
    native.addListener.mockReturnValue({ remove: native.remove });
    const focused = vi.fn();
    let cleanup: (() => void) | undefined;
    vi.spyOn(focusManager, 'setEventListener').mockImplementation((listen) => {
      cleanup = listen(focused);
    });
    await import('@native/lib/api');
    const [event, listener] = native.addListener.mock.calls[0];
    expect(event).toBe('change');
    listener('active');
    listener('background');
    expect(focused.mock.calls).toEqual([[true], [false]]);
    cleanup?.();
    expect(native.remove).toHaveBeenCalledOnce();
  });
});

describe('native query connectivity', () => {
  async function listen() {
    native.platform = 'ios';
    const online = vi.fn();
    let cleanup: (() => void) | undefined;
    vi.spyOn(onlineManager, 'setEventListener').mockImplementation((subscribe) => {
      cleanup = subscribe(online);
    });
    await import('@native/lib/api');
    const listener = native.addNetworkListener.mock.calls[0][0];
    return { online, listener, cleanup };
  }

  it.each([
    [{ isConnected: false }, false],
    [{ isConnected: true, isInternetReachable: false }, false],
    [{ isConnected: true, isInternetReachable: true }, true],
    [{}, true],
  ])('initializes connectivity from %j', async (state, expected) => {
    native.networkState.mockResolvedValue(state);
    const { online } = await listen();
    expect(online).toHaveBeenCalledWith(expected);
  });

  it('ignores a stale initial read after a newer event and after cleanup', async () => {
    let resolve!: (state: { isConnected: boolean }) => void;
    native.networkState.mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    const { online, listener, cleanup } = await listen();
    listener({ isConnected: false });
    resolve({ isConnected: true });
    await Promise.resolve();
    expect(online.mock.calls).toEqual([[false]]);
    cleanup?.();
    expect(native.removeNetwork).toHaveBeenCalledOnce();
  });

  it('does not publish an initial read after disposal', async () => {
    let resolve!: (state: { isConnected: boolean }) => void;
    native.networkState.mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    const { online, cleanup } = await listen();
    cleanup?.();
    resolve({ isConnected: false });
    await Promise.resolve();
    expect(online).not.toHaveBeenCalled();
  });

  it('permits requests when the initial connectivity read fails', async () => {
    native.networkState.mockRejectedValue(new Error('network state unavailable'));
    const { online, listener } = await listen();
    await vi.waitFor(() => expect(online).toHaveBeenCalledWith(true));
    listener({ isConnected: false });
    expect(online).toHaveBeenLastCalledWith(false);
  });

  it('does not replace a newer offline event when the initial read fails', async () => {
    let reject!: (error: Error) => void;
    native.networkState.mockReturnValue(
      new Promise((_resolve, fail) => {
        reject = fail;
      }),
    );
    const { online, listener } = await listen();
    listener({ isConnected: false });
    reject(new Error('network state unavailable'));
    await Promise.resolve();
    await Promise.resolve();
    expect(online.mock.calls).toEqual([[false]]);
  });

  it('refetches an active failed query when connectivity returns without a focus change', async () => {
    native.platform = 'ios';
    const { queryClient } = await import('@native/lib/api');
    queryClient.mount();
    const query = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue('ready');
    const observer = new QueryObserver(queryClient, {
      queryKey: ['connectivity-regression'],
      queryFn: query,
      retry: false,
    });
    const unsubscribe = observer.subscribe(() => {});
    try {
      await vi.waitFor(() => expect(observer.getCurrentResult().isError).toBe(true));
      const listener = native.addNetworkListener.mock.calls[0][0];
      listener({ isConnected: false });
      expect(onlineManager.isOnline()).toBe(false);
      listener({ isConnected: true, isInternetReachable: true });
      await vi.waitFor(() => expect(observer.getCurrentResult().data).toBe('ready'));
      expect(query).toHaveBeenCalledTimes(2);
    } finally {
      unsubscribe();
      queryClient.unmount();
      queryClient.clear();
    }
  });
});
