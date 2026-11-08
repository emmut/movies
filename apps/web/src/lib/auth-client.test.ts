import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

const { social, markPendingGreet, clearPendingGreet } = vi.hoisted(() => ({
  social: vi.fn(),
  markPendingGreet: vi.fn(),
  clearPendingGreet: vi.fn(),
}));
vi.mock('better-auth/react', () => ({
  createAuthClient: () => ({ signIn: { social } }),
}));
vi.mock('@/env', () => ({ env: { NEXT_PUBLIC_BASE_URL: 'http://localhost:3000' } }));
vi.mock('@/lib/pending-greet', () => ({ markPendingGreet, clearPendingGreet }));

import {
  signInDiscord,
  signInGitHub,
  signInGoogle,
  signInGoogleSettings,
  signInGitHubSettings,
  signInSettings,
} from './auth-client';

const providers = [
  { provider: 'google', login: signInGoogle, settings: signInGoogleSettings },
  { provider: 'discord', login: signInDiscord, settings: signInSettings },
  { provider: 'github', login: signInGitHub, settings: signInGitHubSettings },
];

beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

for (const { provider, login, settings } of providers) {
  describe(`${provider} social sign-in`, () => {
    it('preserves the destination and login greeting lifecycle', async () => {
      const response = { data: { url: 'https://provider.example/authorize' }, error: null };
      social.mockResolvedValue(response);
      expect(await login('/watchlist?page=2')).toBe(response);
      expect(social).toHaveBeenCalledWith(
        {
          provider,
          callbackURL: '/watchlist?page=2',
          errorCallbackURL: '/login?error=failed_to_login',
        },
        expect.any(Object),
      );
      const hooks = social.mock.calls[0][1];
      hooks.onRequest();
      expect(markPendingGreet).toHaveBeenCalledOnce();
      hooks.onError();
      expect(clearPendingGreet).toHaveBeenCalledOnce();
    });

    it('rejects external redirect destinations', async () => {
      social.mockResolvedValue({ error: null });
      await login('https://evil.example');
      expect(social.mock.calls[0][0].callbackURL).toBe('/');
      await settings('//evil.example');
      expect(social.mock.calls[1][0].callbackURL).toBe('/');
    });

    it('links a guest using the settings error destination without a login greeting', async () => {
      const response = { error: null };
      social.mockResolvedValue(response);
      expect(await settings('/settings')).toBe(response);
      expect(social).toHaveBeenCalledWith({
        provider,
        callbackURL: '/settings',
        errorCallbackURL: '/settings?error=failed_to_link_account',
      });
      expect(markPendingGreet).not.toHaveBeenCalled();
    });

    it('returns provider failures and handles network failures without a stale greeting', async () => {
      const response = { error: { message: 'denied' }, data: null };
      social.mockResolvedValueOnce(response);
      expect(await login('/')).toBe(response);
      social.mockRejectedValueOnce(new Error('offline'));
      expect(await login('/')).toEqual({ error: expect.any(String), data: null });
      expect(clearPendingGreet).toHaveBeenCalledOnce();
    });

    it('handles rejected and thrown settings requests', async () => {
      social.mockResolvedValueOnce({ error: { message: 'denied' } });
      expect(await settings('/')).toEqual({ error: expect.any(String), data: null });
      social.mockRejectedValueOnce(new Error('offline'));
      expect(await settings('/')).toEqual({ error: expect.any(String), data: null });
    });
  });
}
