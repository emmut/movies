import type { CatalogDetail } from '@movies/api/catalog';
import { catalogFacts, catalogStats } from '@native/lib/catalog-model';
import { describe, expect, it } from 'vitest';

const movie: Extract<CatalogDetail, { type: 'movie' }> = {
  id: 42,
  type: 'movie',
  title: 'Test movie',
  originalTitle: 'Test movie',
  releaseDate: '2026-01-01',
  posterUrl: null,
  backdropUrl: null,
  rating: 8.21,
  overview: '',
  tagline: '',
  genres: [],
  voteCount: 100,
  popularity: 15.6,
  status: '',
  languages: [],
  originCountries: [],
  homepage: null,
  certification: null,
  runtime: 125,
  budget: 1000,
  revenue: 500,
};
const series: Extract<CatalogDetail, { type: 'tv' }> = {
  ...movie,
  type: 'tv',
  originalTitle: 'Original series',
  seasons: 3,
  episodes: 24,
  episodeRuntimes: [45, 60],
  lastAirDate: '2025-01-01',
  networks: ['A network'],
};
describe('catalog presentation', () => {
  it('matches movie score, runtime, date and popularity cards', () => {
    expect(catalogStats(movie)).toEqual([
      { label: 'TMDB Rating', value: '8.3', accent: 'yellow' },
      { label: 'Runtime', value: '2h 5m', accent: 'blue' },
      { label: 'Released', value: '2026', accent: 'green' },
      { label: 'Popularity', value: '16', accent: 'purple' },
    ]);
  });
  it('omits absent movie runtime and falls back for missing release dates', () => {
    const stats = catalogStats({ ...movie, runtime: null, releaseDate: '' });
    expect(stats.map((stat) => stat.label)).not.toContain('Runtime');
    expect(stats).toContainEqual({ label: 'Released', value: 'N/A', accent: 'green' });
    expect(catalogStats({ ...movie, runtime: 0 }).map((stat) => stat.label)).not.toContain(
      'Runtime',
    );
  });
  it('shows seasons in TV stats', () => {
    expect(catalogStats(series)).toContainEqual({ label: 'Seasons', value: '3', accent: 'blue' });
    expect(catalogStats(series).map((stat) => stat.label)).toContain('First Aired');
  });
  it('shows reported financials including negative profits', () => {
    expect(catalogFacts(movie)).toEqual([
      { label: 'Status', value: 'Unknown' },
      { label: 'Original Title', value: 'Test movie' },
      { label: 'Release Date', value: '2026-01-01' },
      { label: 'Budget', value: 'USD 1,000' },
      { label: 'Revenue', value: 'USD 500' },
      { label: 'Profit', value: '-USD 500' },
    ]);
  });
  it('does not fabricate money or profit from incomplete data', () => {
    expect(
      catalogFacts({ ...movie, budget: 0, revenue: 0 }).map((fact) => fact.label),
    ).not.toContain('Profit');
    expect(catalogFacts({ ...movie, budget: 0 }).map((fact) => fact.label)).not.toContain('Budget');
    expect(catalogFacts({ ...movie, revenue: 0 }).map((fact) => fact.label)).not.toContain(
      'Revenue',
    );
  });
  it('includes original names, TV facts and languages', () => {
    const facts = catalogFacts({ ...series, languages: ['English'], status: 'Ended' });
    expect(facts).toContainEqual({ label: 'Original Name', value: 'Original series' });
    expect(facts).toContainEqual({ label: 'Episode Runtime', value: '45m, 1h 0m' });
    expect(facts).toContainEqual({ label: 'Networks', value: 'A network' });
    expect(facts).toContainEqual({ label: 'Languages', value: 'English' });
  });
  it('uses release fallback and hides empty original titles', () => {
    const facts = catalogFacts({
      ...movie,
      releaseDate: '',
      originalTitle: '',
      budget: 0,
      revenue: 0,
    });
    expect(facts).toContainEqual({ label: 'Release Date', value: 'Not available' });
    expect(facts.map((fact) => fact.label)).not.toContain('Original Title');
  });
});

it('hides a TV original name identical to its title', () => {
  expect(
    catalogFacts({ ...series, originalTitle: series.title }).map((fact) => fact.label),
  ).not.toContain('Original Name');
});
