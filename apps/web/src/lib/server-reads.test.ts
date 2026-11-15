import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

const api = vi.hoisted(() => ({
  catalog: {
    movieDetails: vi.fn(),
    tvDetails: vi.fn(),
    movieCredits: vi.fn(),
    tvCredits: vi.fn(),
    availability: vi.fn(),
    aggregateCredits: vi.fn(),
    externalIds: vi.fn(),
    rating: vi.fn(),
    certification: vi.fn(),
    reviews: vi.fn(),
    related: vi.fn(),
    extras: vi.fn(),
    collection: vi.fn(),
    season: vi.fn(),
    watchLinks: vi.fn(),
  },
  person: { profile: vi.fn(), movieCredits: vi.fn(), tvCredits: vi.fn() },
  discovery: { genres: vi.fn(), providerCatalog: vi.fn(), facets: vi.fn() },
}));
vi.mock('@/lib/api-server', () => ({ createServerApi: () => api }));
vi.mock('next/cache', () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }));
vi.mock('@/lib/auth-server', () => ({ getUser: vi.fn() }));

import { getImdbRating } from './imdb';
import { getMediaCertification, getMediaReviews } from './media-info';
import {
  fetchAvailableGenres,
  getMovieCredits,
  getMovieDetails,
  getMovieRecommendations,
  getMovieSimilar,
  getMovieWatchProviders,
} from './movies';
import { getAggregateCredits, getCollection, getKeyword, getPdpExtras, getSeason } from './pdp';
import { getPersonDetails, getPersonMovieCredits, getPersonTvCredits } from './persons';
import { getTmdbExternalIds } from './tmdb-external-ids';
import {
  fetchAvailableTvGenres,
  getTvShowCredits,
  getTvShowDetails,
  getTvShowRecommendations,
  getTvShowSimilar,
  getTvShowWatchProviders,
} from './tv-shows';
import { getAllWatchProviders } from './user-actions';
import { getWikidataWatchLinks } from './wikidata';

beforeEach(() => vi.resetAllMocks());
describe('server reads use the common router', () => {
  it.each([
    [() => getMovieDetails(7), api.catalog.movieDetails, { id: 7 }],
    [() => getTvShowDetails(7), api.catalog.tvDetails, { id: 7 }],
    [() => getMovieCredits(7), api.catalog.movieCredits, { id: 7 }],
    [() => getTvShowCredits(7), api.catalog.tvCredits, { id: 7 }],
    [() => getPersonDetails(7), api.person.profile, { id: 7 }],
    [() => getPersonMovieCredits(7), api.person.movieCredits, { id: 7 }],
    [() => getPersonTvCredits(7), api.person.tvCredits, { id: 7 }],
    [() => getAggregateCredits(7), api.catalog.aggregateCredits, { id: 7 }],
    [() => getMovieWatchProviders(7), api.catalog.availability, { id: 7, type: 'movie' }],
    [() => getTvShowWatchProviders(7), api.catalog.availability, { id: 7, type: 'tv' }],
    [() => fetchAvailableGenres(), api.discovery.genres, { type: 'movie' }],
    [() => fetchAvailableTvGenres(), api.discovery.genres, { type: 'tv' }],
    [() => getTmdbExternalIds('tv', 7), api.catalog.externalIds, { id: 7, type: 'tv' }],
    [
      () => getPdpExtras('movie', 7, 'SE'),
      api.catalog.extras,
      { id: 7, type: 'movie', region: 'SE' },
    ],
    [() => getCollection(7), api.catalog.collection, { id: 7 }],
    [() => getSeason(7, 0), api.catalog.season, { id: 7, season: 0 }],
    [() => getWikidataWatchLinks('tv', 7), api.catalog.watchLinks, { id: 7, type: 'tv' }],
    [
      () => getMediaCertification('movie', 7, 'US'),
      api.catalog.certification,
      { id: 7, type: 'movie', region: 'US' },
    ],
  ] as const)('preserves results and validated inputs for %#', async (read, procedure, input) => {
    const value = { id: 7, retainedMetadata: { full: true } };
    procedure.mockResolvedValue(value);
    expect(await read()).toBe(value);
    expect(procedure).toHaveBeenCalledExactlyOnceWith(input);
  });
  it.each([
    [getMovieRecommendations, 'movie', 'recommendations'],
    [getMovieSimilar, 'movie', 'similar'],
    [getTvShowRecommendations, 'tv', 'recommendations'],
    [getTvShowSimilar, 'tv', 'similar'],
  ] as const)('preserves related-title kind and region for %#', async (read, type, kind) => {
    const cards = [{ id: 1, title: 'Related' }];
    api.catalog.related.mockResolvedValue(cards);
    expect(await read(7, 'US')).toBe(cards);
    expect(api.catalog.related).toHaveBeenCalledExactlyOnceWith({
      id: 7,
      type,
      kind,
      region: 'US',
    });
  });
  it('keeps review pagination and counts from the shared projection', async () => {
    api.catalog.reviews.mockResolvedValue({
      reviews: [{ id: 'r' }],
      totalPages: 2,
      totalResults: 21,
    });
    expect(await getMediaReviews('tv', 7, 2)).toEqual({
      reviews: [{ id: 'r' }],
      totalPages: 2,
      totalResults: 21,
    });
    expect(api.catalog.reviews).toHaveBeenCalledExactlyOnceWith({ id: 7, type: 'tv', page: 2 });
  });
  it('requests only the selected keyword rather than a discovery page', async () => {
    api.discovery.facets.mockResolvedValue([{ id: 7, name: 'Time travel' }]);
    expect(await getKeyword(7)).toEqual({ id: 7, name: 'Time travel' });
    expect(api.discovery.facets).toHaveBeenCalledExactlyOnceWith({
      kind: 'keyword',
      ids: [7],
      query: '',
    });
  });
  it('keeps provider priority metadata for settings and filters', async () => {
    api.discovery.providerCatalog.mockResolvedValue([
      { provider_id: 8, display_priority: 4, logo_path: '/logo.jpg' },
    ]);
    expect(await getAllWatchProviders('SE')).toEqual([
      { provider_id: 8, display_priority: 4, logo_path: '/logo.jpg' },
    ]);
    expect(api.discovery.providerCatalog).toHaveBeenCalledExactlyOnceWith({
      type: 'movie',
      region: 'SE',
    });
  });
  it('does not cache substitutes for failed optional resource reads', async () => {
    api.catalog.certification.mockRejectedValue(new Error('upstream unavailable'));
    await expect(getMediaCertification('movie', 7, 'SE')).rejects.toThrow('upstream unavailable');
    api.catalog.externalIds.mockRejectedValue(new Error('external IDs unavailable'));
    await expect(getTmdbExternalIds('movie', 7)).rejects.toThrow('external IDs unavailable');
  });
  it('validates IMDb IDs and degrades a failed local rating without a direct database query', async () => {
    expect(await getImdbRating(null)).toBeNull();
    expect(await getImdbRating('invalid')).toBeNull();
    expect(api.catalog.rating).not.toHaveBeenCalled();
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    api.catalog.rating.mockRejectedValue(new Error('rating unavailable'));
    expect(await getImdbRating('tt0111161')).toBeNull();
    log.mockRestore();
    api.catalog.rating.mockResolvedValue({ rating: 9.3, numVotes: 10 });
    expect(await getImdbRating('tt0111161')).toEqual({ rating: 9.3, numVotes: 10 });
  });
});
