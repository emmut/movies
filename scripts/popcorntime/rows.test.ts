import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vite-plus/test';

import { readParquetBatches, readParquetRows } from './parquet';
import { mapProviders } from './providers';
import { collectLinks, mapMedia } from './rows';

const token = '3xK9mPv2bQ7nRtYsABCDEFGHJKLMN';
const link = {
  media_id: 'movie',
  provider_id: 'netflix',
  addon_provider_id: null,
  season_number: null,
  episode_number: null,
  link_token: token,
  price_types: ['flatrate'],
  available_from: null,
  available_to: null,
};
const media = mapMedia([{ id: 'movie', tmdb_id: '123', content_type: 'movie' }]);
const provider = { id: 'netflix', name: 'Netflix', parent_id: null, country: 'SE' };
const context = { region: 'SE', media, providers: mapProviders([provider], 'SE') };

async function* batches(rows: unknown[]) {
  yield rows.slice(0, 1);
  yield rows.slice(1);
}

describe('Popcorn Time identity and offer matching', () => {
  it('keeps movie and TV namespaces distinct, skips missing identities, rejects conflicting crosswalks', () => {
    const result = mapMedia([
      { id: 'movie', tmdb_id: '123', content_type: 'movie' },
      { id: 'tv', tmdb_id: '123', content_type: 'tv_show' },
      { id: 'missing', tmdb_id: null, content_type: 'movie' },
      { id: 'conflict', tmdb_id: '123', content_type: 'movie' },
      { id: 'conflict', tmdb_id: '456', content_type: 'movie' },
    ]);
    expect([...result.values()]).toEqual([
      { tmdbId: 123, mediaType: 'movie' },
      { tmdbId: 123, mediaType: 'tv' },
    ]);
    expect(() => mapMedia([{ id: 'bad', tmdb_id: 'NaN', content_type: 'movie' }])).toThrow();
  });

  it('uses exact registry names and market mappings, leaving bundles and ambiguous brands unresolved', () => {
    const rows = [
      provider,
      { ...provider, id: 'channel', parent_id: 'amazon' },
      { ...provider, id: 'ad-tier', name: 'Netflix with Ads' },
      { ...provider, id: 'apple', name: 'Apple TV' },
      { ...provider, id: 'prime', name: 'Amazon Prime Video', country: null },
      { ...provider, id: 'conflict' },
      { ...provider, id: 'conflict', name: 'SF Anytime' },
    ];
    const se = mapProviders(rows, 'SE');
    expect(se.get('netflix')?.[0].id).toBe(8);
    expect(se.get('prime')?.[0].id).toBe(119);
    expect(mapProviders(rows, 'US').get('prime')?.[0].id).toBe(9);
    expect(se.has('channel')).toBe(false);
    expect(se.get('ad-tier')).toEqual([]);
    expect(se.get('apple')).toEqual([]);
    expect(se.has('conflict')).toBe(false);
    expect(mapProviders(rows, 'US').has('netflix')).toBe(false);
  });

  it('deduplicates equal links and rejects conflicting tokens across batches', async () => {
    const { links } = await collectLinks(batches([link, link]), context);
    expect(links).toEqual([
      {
        mediaType: 'movie',
        tmdbId: 123,
        region: 'SE',
        providerId: 8,
        offerType: 'flatrate',
        linkToken: token,
        availableFrom: null,
        availableTo: null,
      },
    ]);
    await expect(
      collectLinks(batches([link, { ...link, link_token: '4' + token.slice(1) }]), context),
    ).rejects.toThrow('no supported, unambiguous links');
  });

  it.each([
    { season_number: 1 },
    { episode_number: 1 },
    { addon_provider_id: 'showtime' },
    { media_id: 'unknown' },
    { provider_id: 'unknown' },
    { price_types: ['rent'] },
    { price_types: ['flatrate_and_buy'] },
    { price_types: null },
  ])('does not promote an unsupported offer to a title link: %j', async (change) => {
    await expect(collectLinks(batches([{ ...link, ...change }]), context)).rejects.toThrow(
      'no supported',
    );
  });

  it.each(['https://evil.example', '../escape', 'token/extra', '0OIl', 'a'.repeat(4097)])(
    'rejects unsafe tokens: %s',
    async (link_token) => {
      await expect(collectLinks(batches([{ ...link, link_token }]), context)).rejects.toThrow();
    },
  );

  it('rejects schema drift and invalid date intervals', async () => {
    await expect(
      collectLinks(batches([{ ...link, price_types: undefined }]), context),
    ).rejects.toThrow();
    await expect(
      collectLinks(
        batches([{ ...link, available_from: '2026-11-10', available_to: '2026-11-01' }]),
        context,
      ),
    ).rejects.toThrow('invalid availability interval');
  });

  it('joins actual Zstandard Parquet metadata, lists, dates, and multiple row groups', async () => {
    function fixture(name: string) {
      return fileURLToPath(new URL(`./fixtures/${name}.parquet`, import.meta.url));
    }
    const identities = mapMedia(
      await readParquetRows(fixture('media'), ['id', 'tmdb_id', 'content_type']),
    );
    const providers = mapProviders(
      await readParquetRows(fixture('providers'), ['id', 'name', 'parent_id', 'country']),
      'SE',
    );
    const columns = Object.keys(link);
    const result = await collectLinks(readParquetBatches(fixture('links'), columns), {
      region: 'SE',
      media: identities,
      providers,
    });
    expect(result.total).toBe(3);
    expect(result.links.map((row) => [row.mediaType, row.tmdbId, row.availableFrom])).toEqual([
      ['movie', 123, '2026-01-01'],
      ['tv', 123, null],
    ]);
    await expect(readParquetRows(fixture('media'), ['missing_column'])).rejects.toThrow(
      'missing column',
    );
  });
});
