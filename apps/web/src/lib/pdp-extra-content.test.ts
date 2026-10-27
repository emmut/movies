import { describe, expect, it } from 'vite-plus/test';

import type { TmdbVideo } from '@/types/tmdb-video';

import {
  getGalleryImages,
  getKeywords,
  getPlayableVideos,
  getRegionalReleases,
} from './pdp-extra-content';

function video(overrides: Partial<TmdbVideo> = {}): TmdbVideo {
  return {
    id: '1',
    key: 'valid-key',
    site: 'YouTube',
    name: 'Trailer',
    type: 'Trailer',
    official: true,
    published_at: '',
    size: 1080,
    iso_639_1: 'en',
    iso_3166_1: 'US',
    ...overrides,
  };
}

describe('PDP content preparation', () => {
  it('returns empty collections for absent optional responses', () => {
    expect(getGalleryImages(undefined)).toEqual([]);
    expect(getPlayableVideos(undefined)).toEqual([]);
    expect(getKeywords(undefined)).toEqual([]);
    expect(getRegionalReleases(undefined, 'SE')).toEqual([]);
  });
  it('limits each gallery category independently and preserves backdrop-first order', () => {
    const backdrops = Array.from({ length: 10 }, (_, i) => ({ file_path: `/backdrop-${i}` }));
    const posters = Array.from({ length: 10 }, (_, i) => ({ file_path: `/poster-${i}` }));
    expect(getGalleryImages({ backdrops, posters })).toEqual([
      ...backdrops.slice(0, 8),
      ...posters.slice(0, 8),
    ]);
    expect(backdrops).toHaveLength(10);
  });
  it('filters unsupported videos before applying the display limit', () => {
    const invalid = [video({ site: 'Vimeo' }), video({ key: 'invalid?key' }), video({ key: '' })];
    const valid = Array.from({ length: 15 }, (_, i) => video({ id: String(i) }));
    expect(getPlayableVideos({ id: 1, results: [...invalid, ...valid] })).toEqual(
      valid.slice(0, 12),
    );
  });
  it('normalizes both keyword response formats', () => {
    const keywords = [{ id: 10, name: 'Time travel' }];
    expect(getKeywords({ keywords })).toEqual(keywords);
    expect(getKeywords({ results: keywords })).toEqual(keywords);
    expect(getKeywords({})).toEqual([]);
  });
  it('deduplicates by release type and day, sorts dates, and preserves distinct formats', () => {
    function release(type: number, date: string) {
      return { type, release_date: date, certification: '', iso_639_1: '' };
    }
    const releases = {
      id: 1,
      results: [
        {
          iso_3166_1: 'SE',
          release_dates: [
            release(4, '2026-04-01T12:00:00Z'),
            release(4, '2026-04-01T00:00:00Z'),
            release(3, '2026-03-01T00:00:00Z'),
            release(5, '2026-04-01T00:00:00Z'),
            release(99, '2026-05-01T00:00:00Z'),
          ],
        },
      ],
    };
    expect(getRegionalReleases(releases, 'SE')).toEqual([
      { key: '3:2026-03-01', label: 'Theatrical', date: '2026-03-01' },
      { key: '4:2026-04-01', label: 'Digital', date: '2026-04-01' },
      { key: '5:2026-04-01', label: 'Physical', date: '2026-04-01' },
      { key: '99:2026-05-01', label: 'Release', date: '2026-05-01' },
    ]);
    expect(getRegionalReleases(releases, 'US')).toEqual([]);
  });
});
