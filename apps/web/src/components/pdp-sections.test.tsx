import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
vi.mock('@/components/image-proxy', () => ({ Imgproxy: () => null }));
vi.mock('@/lib/pdp', () => ({
  getSeason: vi.fn(),
  getCollection: vi.fn(),
  getAggregateCredits: vi.fn(),
}));
import { getAggregateCredits, getCollection, getSeason } from '@/lib/pdp';

import {
  MovieCollection,
  ProductionCompanies,
  SeasonEpisodes,
  TvRoleCredits,
  TvSeasons,
} from './pdp-sections';

beforeEach(() => vi.clearAllMocks());
describe('PDP sections', () => {
  it('hides absent production companies and missing episode data', () => {
    expect(renderToStaticMarkup(<ProductionCompanies />)).toBe('');
    const html = renderToStaticMarkup(<TvSeasons tvId={1} />);
    expect(html).not.toContain('Next Episode');
    expect(html).not.toContain('Latest Episode');
  });
  it('keeps episode spoilers inside collapsed details and handles unknown runtime/rating', async () => {
    vi.mocked(getSeason).mockResolvedValue({
      name: 'Specials',
      episodes: [
        {
          id: 1,
          episode_number: 1,
          season_number: 0,
          name: 'Spoiler title',
          overview: 'Spoiler plot',
          still_path: null,
          air_date: null,
          runtime: null,
          vote_average: 0,
          vote_count: 0,
        },
      ],
    });
    const html = renderToStaticMarkup(await SeasonEpisodes({ tvId: 1, seasonNumber: 0 }));
    expect(html).toContain('<details');
    expect(html).not.toContain('open=""');
    const summary = html.match(/<summary[^>]*>(.*?)<\/summary>/)?.[1];
    expect(summary).toContain('Episode 1');
    expect(summary).not.toContain('Spoiler');
    expect(html).toContain('Not yet rated');
    expect(html).not.toContain('null min');
  });
  it('excludes the current movie and orders other collection movies chronologically', async () => {
    vi.mocked(getCollection).mockResolvedValue({
      name: 'Collection',
      parts: [
        { id: 1, title: 'Current', release_date: '2000-01-01', poster_path: null },
        { id: 3, title: 'Later', release_date: '2020-01-01', poster_path: null },
        { id: 2, title: 'Earlier', release_date: '2010-01-01', poster_path: null },
      ],
    });
    const html = renderToStaticMarkup(await MovieCollection({ collectionId: 1, currentId: 1 }));
    expect(html).not.toContain('Current');
    expect(html.indexOf('Earlier')).toBeLessThan(html.indexOf('Later'));
    expect(html).toContain('/movie/2');
  });
  it('renders aggregate roles and total episode counts with person links', async () => {
    vi.mocked(getAggregateCredits).mockResolvedValue({
      cast: [
        {
          id: 42,
          name: 'Actor',
          roles: [{ character: 'Detective', episode_count: 3 }],
          total_episode_count: 3,
        },
      ],
    });
    const html = renderToStaticMarkup(await TvRoleCredits({ tvId: 1 }));
    expect(html).toContain('/person/42');
    expect(html).toContain('Detective (3 episodes)');
    expect(html).toContain('3 episodes total');
  });
  it('degrades failed optional sections without throwing', async () => {
    vi.mocked(getSeason).mockRejectedValue(new Error('Unavailable'));
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(renderToStaticMarkup(await SeasonEpisodes({ tvId: 1, seasonNumber: 1 }))).toContain(
      'temporarily unavailable',
    );
    log.mockRestore();
  });
});
