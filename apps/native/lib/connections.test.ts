import { beforeEach, expect, it, vi } from 'vite-plus/test';

const config = vi.hoisted(() => ({
  EXPO_PUBLIC_SERVER_URL: undefined as string | undefined,
  EXPO_PUBLIC_WEB_URL: undefined as string | undefined,
}));
vi.mock('@native/src/env', () => ({ ENV: config }));
vi.mock('expo-constants', () => ({ default: { expoConfig: { hostUri: '192.168.1.78:8081' } } }));
vi.mock('react-native', () => ({ Platform: { OS: 'ios' } }));

beforeEach(() => {
  vi.resetModules();
  config.EXPO_PUBLIC_SERVER_URL = undefined;
  config.EXPO_PUBLIC_WEB_URL = undefined;
});

it('keeps native OAuth on the callback origin while product requests use the API', async () => {
  config.EXPO_PUBLIC_SERVER_URL = 'https://api.example.com';
  config.EXPO_PUBLIC_WEB_URL = 'https://movies.example.com';
  const { authUrl, serverUrl } = await import('@native/lib/connections');
  expect(authUrl).toBe('https://movies.example.com');
  expect(serverUrl).toBe('https://api.example.com');
});

it('derives separate web/auth and API ports from the Expo host for local devices', async () => {
  const { authUrl, serverUrl } = await import('@native/lib/connections');
  expect(authUrl).toBe('http://192.168.1.78:3000');
  expect(serverUrl).toBe('http://192.168.1.78:3001');
});
