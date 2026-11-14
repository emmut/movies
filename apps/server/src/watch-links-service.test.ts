import { createWatchLinksService } from '@server/watch-links-service';
import { expect, it, vi } from 'vite-plus/test';

it('maps validated provider identifiers and supplies a bounded optional lookup', async () => {
  const tmdb = vi.fn().mockResolvedValue({ wikidata_id: 'Q42' });
  const fetcher = vi.fn().mockResolvedValue(
    new Response(
      JSON.stringify({
        entities: {
          Q42: {
            claims: {
              P1874: [
                {
                  rank: 'normal',
                  mainsnak: {
                    snaktype: 'value',
                    datatype: 'external-id',
                    datavalue: { value: '12345678' },
                  },
                },
              ],
            },
          },
        },
      }),
    ),
  );
  expect(
    await createWatchLinksService(tmdb, fetcher).watchLinks({ id: 42, type: 'movie' }),
  ).toEqual([
    {
      providerId: 8,
      types: ['flatrate'],
      regions: undefined,
      url: 'https://www.netflix.com/title/12345678',
    },
  ]);
  expect(fetcher.mock.calls[0][0].hostname).toBe('www.wikidata.org');
  expect(fetcher.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
});

it.each([null, 'invalid', 'https://example.com'])(
  'does not fetch an absent or invalid Wikidata identifier %s',
  async (wikidata_id) => {
    const fetcher = vi.fn();
    expect(
      await createWatchLinksService(vi.fn().mockResolvedValue({ wikidata_id }), fetcher).watchLinks(
        { id: 42, type: 'movie' },
      ),
    ).toEqual([]);
    expect(fetcher).not.toHaveBeenCalled();
  },
);

it('keeps provider fallback available when the optional lookup fails', async () => {
  const fetcher = vi.fn().mockRejectedValue(new Error('offline'));
  expect(
    await createWatchLinksService(
      vi.fn().mockResolvedValue({ wikidata_id: 'Q42' }),
      fetcher,
    ).watchLinks({ id: 42, type: 'tv' }),
  ).toEqual([]);
});
