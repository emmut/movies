import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

vi.mock('@/components/image-proxy', () => ({ Imgproxy: () => null }));
vi.mock('@/lib/pdp', () => ({ getSeason: vi.fn() }));

import { getSeason } from '@/lib/pdp';

import { SeasonEpisodes } from './season-episodes';

beforeEach(() => vi.clearAllMocks());
describe('Season episodes', () => {
  it('hides episode spoilers behind card reveal controls and handles unknown runtime/rating', async () => {
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
    expect(html).toContain('data-slot="card"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('Reveal episode');
    expect(html).not.toContain('Spoiler title');
    expect(html).not.toContain('Spoiler plot');
    expect(html).toContain('Not yet rated');
    expect(html).not.toContain('null min');
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
