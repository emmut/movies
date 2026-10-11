import { afterEach, expect, it, vi } from 'vitest';

import { createTmdbFetch } from './tmdb-fetch';

afterEach(() => vi.unstubAllGlobals());
it('keeps independently configured consumers isolated', async () => {
  const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ results: [] })));
  vi.stubGlobal('fetch', fetcher);
  await createTmdbFetch('web-token', 'http://localhost:9001/3/')('/movie/now_playing');
  fetcher.mockResolvedValue(new Response(JSON.stringify({ results: [] })));
  await createTmdbFetch('hono-token', 'http://localhost:9002/3')('/tv/popular');
  expect(fetcher).toHaveBeenNthCalledWith(
    1,
    new URL('http://localhost:9001/3/movie/now_playing'),
    expect.objectContaining({
      headers: { authorization: 'Bearer web-token', accept: 'application/json' },
    }),
  );
  expect(fetcher).toHaveBeenNthCalledWith(
    2,
    new URL('http://localhost:9002/3/tv/popular'),
    expect.objectContaining({
      headers: { authorization: 'Bearer hono-token', accept: 'application/json' },
    }),
  );
});
