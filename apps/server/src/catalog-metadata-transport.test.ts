import { TmdbRequestError } from '@movies/api/tmdb-fetch';
import { createCatalogService } from '@movies/services/catalog-service';
import { createDiscoveryService } from '@movies/services/discovery-service';
import { createPersonService } from '@movies/services/person-service';
import { createApp } from '@server/app';
import { createTestClient, mockServices } from '@server/test-services';
import { describe, expect, it, vi } from 'vite-plus/test';

function setup() {
  const upstream = vi.fn();
  const rating = vi.fn();
  const app = createApp(
    mockServices({
      catalog: createCatalogService(upstream, { readRating: rating }),
      person: createPersonService(upstream),
      discovery: createDiscoveryService(upstream),
    }),
  );
  return { client: createTestClient(app), upstream, rating, app };
}

describe('full resource RPC contracts', () => {
  it('preserves full movie facts and production metadata through HTTP serialization', async () => {
    const { client, upstream } = setup();
    const facts = {
      id: 7,
      title: 'Movie',
      original_title: 'Original',
      overview: 'Overview',
      imdb_id: 'tt0111161',
      budget: 10,
      revenue: 20,
      runtime: 125,
      production_companies: [{ id: 2, name: 'Studio', logo_path: '/studio.png' }],
      belongs_to_collection: { id: 3, name: 'Collection' },
      spoken_languages: [{ english_name: 'Swedish', iso_639_1: 'sv', name: 'Svenska' }],
    };
    upstream.mockResolvedValue(facts);
    expect(await client.catalog.movieDetails({ id: 7 })).toMatchObject(facts);
    expect(upstream).toHaveBeenCalledExactlyOnceWith('/movie/7');
  });
  it('preserves TV episode guides, creators, networks and specials', async () => {
    const { client, upstream } = setup();
    const show = {
      id: 7,
      name: 'Series',
      number_of_seasons: 2,
      number_of_episodes: 8,
      episode_run_time: [40],
      created_by: [{ id: 2, name: 'Creator', credit_id: 'creator', profile_path: '/creator.jpg' }],
      networks: [{ id: 3, name: 'Network', logo_path: '/network.png', origin_country: 'SE' }],
      seasons: [
        {
          id: 4,
          name: 'Specials',
          season_number: 0,
          episode_count: 1,
          poster_path: null,
          air_date: null,
        },
      ],
    };
    upstream.mockResolvedValue(show);
    expect(await client.catalog.tvDetails({ id: 7 })).toMatchObject(show);
  });
  it('keeps every crew job, department, billing order and profile image', async () => {
    const { client, upstream } = setup();
    const credits = {
      id: 7,
      cast: [
        {
          id: 1,
          name: 'Actor',
          credit_id: 'cast',
          character: 'Lead',
          order: 2,
          profile_path: '/actor.jpg',
        },
      ],
      crew: [
        {
          id: 2,
          name: 'Crew',
          credit_id: 'crew',
          job: 'Editor',
          department: 'Editing',
          profile_path: null,
        },
      ],
    };
    upstream.mockResolvedValue(credits);
    expect(await client.catalog.movieCredits({ id: 7 })).toMatchObject(credits);
  });
  it('preserves person biography metadata and complete credit roles', async () => {
    const { client, upstream } = setup();
    const profile = {
      id: 7,
      name: 'Person',
      biography: 'Biography',
      also_known_as: ['Alias'],
      birthday: '1980-01-01',
      deathday: null,
      place_of_birth: 'Town',
    };
    upstream.mockResolvedValue(profile);
    expect(await client.person.profile({ id: 7 })).toMatchObject(profile);
    upstream.mockResolvedValue({
      id: 7,
      cast: [
        {
          id: 8,
          title: 'Title',
          character: 'Role',
          credit_id: 'credit',
          genre_ids: [18],
          order: 3,
        },
      ],
      crew: [],
    });
    expect((await client.person.movieCredits({ id: 7 })).cast[0]).toMatchObject({
      id: 8,
      title: 'Title',
      character: 'Role',
      credit_id: 'credit',
      genre_ids: [18],
      order: 3,
    });
  });
  it('returns all regional offer types and display priorities for the region selector', async () => {
    const { client, upstream } = setup();
    const provider = {
      provider_id: 8,
      provider_name: 'Service',
      logo_path: '/logo.jpg',
      display_priority: 4,
    };
    upstream.mockResolvedValue({
      results: {
        SE: { link: 'https://watch.example/SE', ads: [provider], flatrate: [provider] },
        US: { link: 'https://watch.example/US', rent: [provider] },
      },
    });
    const result = await client.catalog.availability({ id: 7, type: 'movie' });
    expect(result.results.SE.ads).toEqual([provider]);
    expect(result.results.US.rent).toEqual([provider]);
    upstream.mockResolvedValue({ results: [provider] });
    expect(await client.discovery.providerCatalog({ type: 'movie', region: 'SE' })).toEqual([
      provider,
    ]);
    expect(upstream).toHaveBeenLastCalledWith('/watch/providers/movie', {
      searchParams: { watch_region: 'SE' },
    });
  });
  it('supports genre-only reads without loading unrelated provider/country data', async () => {
    const { client, upstream } = setup();
    upstream.mockResolvedValue({ genres: [{ id: 18, name: 'Drama' }] });
    expect(await client.discovery.genres({ type: 'movie' })).toEqual([{ id: 18, name: 'Drama' }]);
    expect(upstream).toHaveBeenCalledExactlyOnceWith('/genre/movie/list');
  });
  it('reads ratings through the shared store and preserves optional misses', async () => {
    const { client, rating } = setup();
    rating.mockResolvedValue({ rating: 9.3, numVotes: 10 });
    expect(await client.catalog.rating({ imdbId: 'tt0111161' })).toEqual({
      rating: 9.3,
      numVotes: 10,
    });
    expect(rating).toHaveBeenCalledWith('tt0111161');
    rating.mockResolvedValue(null);
    expect(await client.catalog.rating({ imdbId: 'tt0111161' })).toBeNull();
  });
  it('preserves NOT_FOUND and rejects mismatched resource identities', async () => {
    const { client, upstream } = setup();
    upstream.mockRejectedValue(new TmdbRequestError('Missing', 404));
    await expect(client.catalog.movieDetails({ id: 7 })).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
    upstream.mockResolvedValue({ id: 8, title: 'Wrong title' });
    await expect(client.catalog.movieDetails({ id: 7 })).rejects.toMatchObject({
      code: 'INTERNAL_SERVER_ERROR',
    });
  });
  it('does not accept malformed or path-like resource IDs', async () => {
    const { app, upstream } = setup();
    for (const id of [0, -1, 1.5, '7/credits', '7', Number.MAX_SAFE_INTEGER + 1]) {
      const response = await app.request('/rpc/catalog/movieDetails', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ json: { id } }),
      });
      expect(response.status).toBe(400);
    }
    expect(upstream).not.toHaveBeenCalled();
  });
  it('propagates certification outages instead of caching a missing rating', async () => {
    const { client, upstream } = setup();
    upstream.mockRejectedValue(new Error('Temporary upstream failure'));
    await expect(
      client.catalog.certification({ id: 7, type: 'movie', region: 'SE' }),
    ).rejects.toMatchObject({ code: 'INTERNAL_SERVER_ERROR' });
  });
});
