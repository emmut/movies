import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

vi.mock('@/components/image-proxy', () => ({ Imgproxy: () => null }));
vi.mock('@/lib/pdp', () => ({ getAggregateCredits: vi.fn() }));
vi.mock('@/lib/tv-shows', () => ({ getTvShowCredits: vi.fn() }));

import { getAggregateCredits } from '@/lib/pdp';
import { getTvShowCredits } from '@/lib/tv-shows';

import { TvCast } from './tv-cast';

beforeEach(() => vi.clearAllMocks());

describe('TV cast', () => {
  it('combines series roles and episode counts in a single cast slider', async () => {
    vi.mocked(getAggregateCredits).mockResolvedValue({
      cast: [
        {
          id: 42,
          name: 'Actor',
          profile_path: null,
          roles: [
            { character: 'Detective', episode_count: 3 },
            { character: 'Narrator', episode_count: 1 },
            { character: 'Detective', episode_count: 1 },
          ],
          total_episode_count: 5,
        },
        {
          id: 43,
          name: 'Guest',
          profile_path: null,
          roles: [],
          total_episode_count: 1,
        },
      ],
    });

    const html = renderToStaticMarkup(await TvCast({ tvId: 1 }));

    expect(html.match(/<h2/g)).toHaveLength(1);
    expect(html).toContain('/person/42');
    expect(html).toContain('Detective, Narrator');
    expect(html).not.toContain('Detective, Narrator, Detective');
    expect(html).toContain('5 episodes');
    expect(html).toContain('1 episode');
    expect(html).not.toContain('<details');
    expect(getTvShowCredits).not.toHaveBeenCalled();
  });

  it('falls back to billed cast without inventing episode counts', async () => {
    vi.mocked(getAggregateCredits).mockRejectedValue(new Error('Unavailable'));
    vi.mocked(getTvShowCredits).mockResolvedValue({
      id: 1,
      cast: [{ id: 42, name: 'Actor', character: 'Detective', profile_path: '', credit_id: '42' }],
      crew: [],
    });
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});

    const html = renderToStaticMarkup(await TvCast({ tvId: 1 }));

    expect(html).toContain('Detective');
    expect(html).toContain('/person/42');
    expect(html).not.toContain('episodes');
    expect(getTvShowCredits).toHaveBeenCalledWith(1);
    log.mockRestore();
  });

  it('hides the section when the series has no cast', async () => {
    vi.mocked(getAggregateCredits).mockResolvedValue({ cast: [] });
    expect(renderToStaticMarkup(await TvCast({ tvId: 1 }))).toBe('');
  });
});
