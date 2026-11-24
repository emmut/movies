import { afterEach, expect, it, vi } from 'vite-plus/test';

const browser = vi.hoisted(() => ({ openAuthSessionAsync: vi.fn() }));
vi.mock('expo-web-browser', () => browser);
vi.mock('expo-network', () => ({
  getNetworkStateAsync: vi.fn(async () => ({ isConnected: true, isInternetReachable: true })),
  addNetworkStateListener: vi.fn(() => ({ remove: vi.fn() })),
}));
vi.mock('expo-constants', () => ({ default: { expoConfig: { scheme: 'movies' } } }));
vi.mock('expo-linking', () => ({
  createURL: (path: string) => 'movies://' + path.replace(/^\/+/, ''),
}));
vi.mock('react-native', () => ({
  Platform: { OS: 'ios' },
  AppState: { addEventListener: vi.fn(() => ({ remove: vi.fn() })) },
}));
vi.mock('expo-secure-store', () => ({
  getItemAsync: vi.fn(async () => null),
  setItemAsync: vi.fn(async () => {}),
}));
vi.mock('@native/lib/connections', () => ({
  authUrl: 'https://movies.example.com',
  serverUrl: 'https://api.example.com',
}));

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

it('opens Expo OAuth on the web callback origin rather than the product API host', async () => {
  browser.openAuthSessionAsync.mockResolvedValue({ type: 'cancel' });
  const authorization =
    'https://github.com/login/oauth/authorize?state=test-state&redirect_uri=' +
    encodeURIComponent('https://movies.example.com/api/auth/callback/github');
  const fetcher = vi
    .fn<typeof fetch>()
    .mockResolvedValue(Response.json({ url: authorization, redirect: true }));
  vi.stubGlobal('fetch', fetcher);
  const { authClient } = await import('@native/lib/auth-client');
  await authClient.signIn.social({ provider: 'github', callbackURL: '/discover' });
  expect(browser.openAuthSessionAsync).toHaveBeenCalledOnce();
  const [url, callback] = browser.openAuthSessionAsync.mock.calls[0];
  const proxy = new URL(url);
  expect(proxy.origin).toBe('https://movies.example.com');
  expect(proxy.pathname).toBe('/api/auth/expo-authorization-proxy');
  expect(proxy.searchParams.get('authorizationURL')).toBe(authorization);
  expect(callback).toBe('movies://discover');
});
