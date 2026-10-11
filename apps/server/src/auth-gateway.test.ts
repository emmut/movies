import { AUTH_CLIENT_IP_HEADER, verifiedAuthRequest } from '@movies/auth/proxy';
import { createAuthGateway } from '@server/auth-gateway';
import { describe, expect, it, vi } from 'vitest';

const user = {
  id: 'user-1',
  name: 'Test User',
  email: 'test@example.com',
  image: null,
  isAnonymous: true,
};
const session = { user, session: { expiresAt: '2099-01-01T00:00:00.000Z' } };

describe('canonical auth gateway', () => {
  it('signs transport identity for session reads without forwarding caller metadata', async () => {
    const secret = 'a-shared-auth-secret-of-at-least-32-characters';
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(Response.json(session));
    const gateway = createAuthGateway('https://auth.example.com', fetcher, secret);
    expect(
      await gateway.current(
        new Headers({ Cookie: 'signed-cookie', [AUTH_CLIENT_IP_HEADER]: 'forged' }),
        '203.0.113.10',
      ),
    ).toEqual(user);
    const [url, options] = fetcher.mock.calls[0];
    const verified = verifiedAuthRequest(new Request(String(url), options), secret);
    expect(verified.headers.get(AUTH_CLIENT_IP_HEADER)).toBe('203.0.113.10');
    expect(verified.headers.get('cookie')).toBe('signed-cookie');
  });
  it('requires trusted transport identity when signing is configured', async () => {
    const fetcher = vi.fn<typeof fetch>();
    const gateway = createAuthGateway(
      'https://auth.example.com',
      fetcher,
      'a-shared-auth-secret-of-at-least-32-characters',
    );
    await expect(
      gateway.handle(
        new Request('https://api.example.com/api/auth/sign-in/anonymous', {
          method: 'POST',
          body: '{}',
        }),
      ),
    ).rejects.toThrow('Invalid authentication proxy metadata');
    await expect(gateway.current(new Headers({ Cookie: 'signed-cookie' }))).rejects.toThrow();
    expect(fetcher).not.toHaveBeenCalled();
  });
  it.each(['file:///tmp/auth', 'https://name:password@example.com'])(
    'rejects an invalid host %s',
    (url) => {
      expect(() => createAuthGateway(url)).toThrow('Invalid authentication service URL');
    },
  );
  it('forwards auth data and cookies only to the configured host without following redirects', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response('{"success":true}', {
        headers: {
          'Set-Cookie': 'better-auth.session_token=test; HttpOnly',
          'Content-Type': 'application/json',
        },
      }),
    );
    const gateway = createAuthGateway('http://localhost:3000', fetcher);
    const request = new Request('http://localhost:3001/api/auth/sign-in/anonymous', {
      method: 'POST',
      headers: {
        Cookie: 'existing-cookie',
        'Content-Type': 'application/json',
        Origin: 'http://localhost:8083',
        'expo-origin': 'movies://',
        'x-skip-oauth-proxy': 'true',
        Authorization: 'untrusted',
        'x-user-id': 'other-user',
      },
      body: '{}',
    });
    const response = await gateway.handle(request);
    const [target, options] = fetcher.mock.calls[0];
    expect(String(target)).toBe('http://localhost:3000/api/auth/sign-in/anonymous');
    expect(options?.redirect).toBe('manual');
    const headers = new Headers(options?.headers);
    expect(headers.get('cookie')).toBe('existing-cookie');
    expect(headers.get('expo-origin')).toBe('movies://');
    expect(headers.get('x-skip-oauth-proxy')).toBe('true');
    expect(headers.has('authorization')).toBe(false);
    expect(headers.has('x-user-id')).toBe(false);
    expect(response.headers.get('set-cookie')).toContain('better-auth.session_token=test');
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toEqual({ success: true });
  });
  it('preserves redirect and error responses from the canonical auth service', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(null, { status: 302, headers: { Location: 'movies://login' } }),
      )
      .mockResolvedValueOnce(new Response('denied', { status: 403 }));
    const gateway = createAuthGateway('https://auth.example.com', fetcher);
    const redirect = await gateway.handle(
      new Request('https://api.example.com/api/auth/callback/github?code=test'),
    );
    expect(redirect.status).toBe(302);
    expect(redirect.headers.get('location')).toBe('movies://login');
    expect(String(fetcher.mock.calls[0][0])).toContain('?code=test');
    expect(
      (
        await gateway.handle(
          new Request('https://api.example.com/api/auth/sign-out', { method: 'POST' }),
        )
      ).status,
    ).toBe(403);
  });
  it('does not proxy unrelated paths or verify sessions without a cookie', async () => {
    const fetcher = vi.fn<typeof fetch>();
    const gateway = createAuthGateway('https://auth.example.com', fetcher);
    expect((await gateway.handle(new Request('https://api.example.com/private'))).status).toBe(404);
    expect(await gateway.current(new Headers({ 'x-user-id': 'forged' }))).toBeNull();
    expect(fetcher).not.toHaveBeenCalled();
  });
  it('forces database session validation and returns only public identity fields', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({
        ...session,
        session: { ...session.session, token: 'private', userId: user.id },
        user: { ...user, providerToken: 'private' },
      }),
    );
    const gateway = createAuthGateway('https://auth.example.com', fetcher);
    expect(await gateway.current(new Headers({ Cookie: 'signed-cookie' }))).toEqual(user);
    const [target, options] = fetcher.mock.calls[0];
    expect(String(target)).toBe(
      'https://auth.example.com/api/auth/get-session?disableCookieCache=true',
    );
    expect(new Headers(options?.headers).get('cookie')).toBe('signed-cookie');
  });
  it('normalizes absent optional identity fields', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        Response.json({ ...session, user: { id: user.id, name: user.name, email: user.email } }),
      );
    expect(
      await createAuthGateway('https://auth.example.com', fetcher).current(
        new Headers({ Cookie: 'test' }),
      ),
    ).toEqual({ ...user, isAnonymous: false });
  });
  it.each([null, { ...session, session: { expiresAt: '2000-01-01' } }])(
    'rejects missing, revoked or expired sessions',
    async (data) => {
      const fetcher = vi.fn<typeof fetch>().mockResolvedValue(Response.json(data));
      expect(
        await createAuthGateway('https://auth.example.com', fetcher).current(
          new Headers({ Cookie: 'test' }),
        ),
      ).toBeNull();
    },
  );
  it('fails closed when validation fails or the auth service is unavailable', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json({ user, session: { expiresAt: 'invalid' } }))
      .mockResolvedValueOnce(new Response('offline', { status: 503 }));
    const gateway = createAuthGateway('https://auth.example.com', fetcher);
    await expect(gateway.current(new Headers({ Cookie: 'test' }))).rejects.toThrow();
    await expect(gateway.current(new Headers({ Cookie: 'test' }))).rejects.toThrow(
      'Could not verify the session',
    );
  });
});
