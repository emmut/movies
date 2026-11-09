import { gzipSync } from 'node:zlib';

import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

vi.mock('next/cache', () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }));

import { getNetworkCatalog } from './network-catalog';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('TMDB network catalogue', () => {
  it('loads yesterday’s UTC export and parses gzipped JSON lines', async () => {
    vi.useFakeTimers().setSystemTime(new Date('2026-01-01T01:00:00Z'));
    const data = gzipSync('{"id":49,"name":"HBO"}\n{"id":213,"name":"Netflix"}\n');
    const fetchMock = vi.fn().mockResolvedValue(new Response(data));
    vi.stubGlobal('fetch', fetchMock);
    await expect(getNetworkCatalog()).resolves.toEqual([
      { id: 49, name: 'HBO' },
      { id: 213, name: 'Netflix' },
    ]);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://files.tmdb.org/p/exports/tv_network_ids_12_31_2025.json.gz',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });
  it('does not treat a failed catalogue request as empty search results', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 503 })));
    await expect(getNetworkCatalog()).rejects.toThrow('Failed loading network catalogue');
  });
  it.each(['not gzip', '', '{"id":-1,"name":"Bad"}', '{"id":49}'])(
    'rejects corrupt catalogue data %j',
    async (body) => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(new Response(body === 'not gzip' ? body : gzipSync(body))),
      );
      await expect(getNetworkCatalog()).rejects.toThrow();
    },
  );
});
