import { createAuthenticatedFetch } from '@native/lib/auth-transport';
import { describe, expect, it, vi } from 'vitest';

describe('native session transport', () => {
  it('uses browser credentials without exposing a secure cookie to JavaScript headers', async () => {
    const cookies = vi.fn();
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response());
    await createAuthenticatedFetch(
      'web',
      cookies,
      fetcher,
    )('https://api.example.com/rpc', { credentials: 'omit' });
    expect(cookies).not.toHaveBeenCalled();
    expect(fetcher.mock.calls[0][1]).toMatchObject({ credentials: 'include' });
  });
  it('loads the latest native secure cookie for each request and excludes the platform cookie jar', async () => {
    const cookies = vi
      .fn()
      .mockResolvedValueOnce('session=first')
      .mockResolvedValueOnce('session=second');
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response());
    const send = createAuthenticatedFetch('ios', cookies, fetcher);
    await send(
      new Request('https://api.example.com/rpc', {
        headers: { 'Content-Type': 'application/json', Cookie: 'stale' },
      }),
      { headers: { 'x-test': 'present' } },
    );
    await send('https://api.example.com/rpc');
    expect(new Headers(fetcher.mock.calls[0][1]?.headers).get('cookie')).toBe('session=first');
    expect(new Headers(fetcher.mock.calls[0][1]?.headers).get('content-type')).toBe(
      'application/json',
    );
    expect(new Headers(fetcher.mock.calls[0][1]?.headers).get('x-test')).toBe('present');
    expect(new Headers(fetcher.mock.calls[1][1]?.headers).get('cookie')).toBe('session=second');
    expect(fetcher.mock.calls[0][1]?.credentials).toBe('omit');
  });
  it('does not send a stale caller cookie after sign-out', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response());
    await createAuthenticatedFetch(
      'android',
      async () => '',
      fetcher,
    )('https://api.example.com/rpc', { headers: { Cookie: 'stale' } });
    expect(new Headers(fetcher.mock.calls[0][1]?.headers).has('cookie')).toBe(false);
  });
  it('does not send a request when secure cookie storage fails', async () => {
    const fetcher = vi.fn<typeof fetch>();
    const send = createAuthenticatedFetch(
      'ios',
      async () => {
        throw new Error('locked');
      },
      fetcher,
    );
    await expect(send('https://api.example.com/rpc')).rejects.toThrow('locked');
    expect(fetcher).not.toHaveBeenCalled();
  });
});
