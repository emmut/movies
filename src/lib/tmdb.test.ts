import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Concrete env so the module reads a deterministic bearer token.
vi.mock('@/env', () => ({
  env: {
    MOVIE_DB_ACCESS_TOKEN: 'test-token',
  },
}));

// Stub the image-url builder so the poster/profile helpers don't pull in
// imgproxy signing (its own env + native lib); its output is exercised by
// imgproxy-url.test.ts.
vi.mock('@/lib/imgproxy-url', () => ({
  buildProxyImageUrls: vi.fn(() => ({ src: 'proxied', srcSet: 'proxied 1x' })),
}));

import { addPosterImageUrls, addProfileImageUrls, optional, tmdbFetch } from './tmdb';

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

/**
 * Runs `promise` to settlement while draining the backoff timers `tmdbFetch`
 * schedules between retries, so the retry loop resolves without real waits.
 */
async function withTimersFlushed<T>(promise: Promise<T>): Promise<T> {
  // Mark the promise handled up front so a rejection that lands mid-drain isn't
  // flagged as unhandled; the returned promise still settles as normal.
  promise.catch(() => {});
  await vi.runAllTimersAsync();
  return promise;
}

describe('tmdbFetch', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    vi.useFakeTimers();
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('sends an authorized request and parses the JSON body', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ id: 42 }));

    const result = await withTimersFlushed(tmdbFetch<{ id: number }>('/movie/42'));

    expect(result).toEqual({ id: 42 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect((url as URL).toString()).toBe('https://api.themoviedb.org/3/movie/42');
    expect(init.headers).toMatchObject({
      authorization: 'Bearer test-token',
      accept: 'application/json',
    });
  });

  it('appends defined search params and skips undefined ones', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({}));

    await withTimersFlushed(
      tmdbFetch('/search/movie', { searchParams: { query: 'inception', page: 2, year: undefined } }),
    );

    const [url] = fetchMock.mock.calls[0];
    expect((url as URL).searchParams.get('query')).toBe('inception');
    expect((url as URL).searchParams.get('page')).toBe('2');
    expect((url as URL).searchParams.has('year')).toBe(false);
  });

  it('retries a transient status and succeeds on a later attempt', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(null, 503))
      .mockResolvedValueOnce(jsonResponse(null, 429))
      .mockResolvedValueOnce(jsonResponse({ id: 7 }));

    const result = await withTimersFlushed(tmdbFetch<{ id: number }>('/person/7'));

    expect(result).toEqual({ id: 7 });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('retries a thrown network error and succeeds on a later attempt', async () => {
    fetchMock
      .mockRejectedValueOnce(new Error('ECONNRESET'))
      .mockResolvedValueOnce(jsonResponse({ id: 9 }));

    const result = await withTimersFlushed(tmdbFetch<{ id: number }>('/person/9'));

    expect(result).toEqual({ id: 9 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('throws the given error message after exhausting retries on a transient status', async () => {
    fetchMock.mockResolvedValue(jsonResponse(null, 503));

    await expect(
      withTimersFlushed(tmdbFetch('/person/1', { errorMessage: 'Failed loading person details' })),
    ).rejects.toThrow('Failed loading person details');
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('rethrows a network error after exhausting retries', async () => {
    fetchMock.mockRejectedValue(new Error('ECONNRESET'));

    await expect(withTimersFlushed(tmdbFetch('/person/1'))).rejects.toThrow('ECONNRESET');
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('fails fast on a timeout without retrying (a hung upstream should degrade)', async () => {
    fetchMock.mockRejectedValue(
      new DOMException('The operation timed out.', 'TimeoutError'),
    );

    await expect(withTimersFlushed(tmdbFetch('/movie/1'))).rejects.toThrow('timed out');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('does not retry a non-retryable status and throws a default message', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(null, 404));

    await expect(withTimersFlushed(tmdbFetch('/movie/0'))).rejects.toThrow(
      'TMDb request failed: /movie/0 (404)',
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe('optional', () => {
  it('resolves to the fetched value when the promise succeeds', async () => {
    await expect(optional(Promise.resolve({ reviews: ['a'] }), { reviews: [] })).resolves.toEqual({
      reviews: ['a'],
    });
  });

  it('degrades to the fallback when the promise rejects', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const fallback = { reviews: [] as string[] };

    await expect(optional(Promise.reject(new Error('504')), fallback)).resolves.toBe(fallback);
    expect(errorSpy).toHaveBeenCalled();

    errorSpy.mockRestore();
  });
});

describe('addPosterImageUrls', () => {
  it('returns the item unchanged when there is no poster_path', () => {
    const item = { id: 1, poster_path: null };
    expect(addPosterImageUrls(item)).toBe(item);
  });

  it('adds proxied poster urls when a poster_path is present', () => {
    const result = addPosterImageUrls({ id: 1, poster_path: '/poster.jpg' });
    expect(result).toHaveProperty('posterImageUrls');
  });
});

describe('addProfileImageUrls', () => {
  it('returns the item unchanged when there is no profile_path', () => {
    const item = { id: 1, profile_path: null };
    expect(addProfileImageUrls(item)).toBe(item);
  });

  it('adds proxied profile urls when a profile_path is present', () => {
    const result = addProfileImageUrls({ id: 1, profile_path: '/profile.jpg' });
    expect(result).toHaveProperty('profileImageUrls');
  });
});
