import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

vi.mock('@/lib/pdp', () => ({ getPdpExtras: vi.fn() }));

import { getPdpExtras } from '@/lib/pdp';
import type { TmdbVideo } from '@/types/tmdb-video';

import { TrailerContent } from './trailer-content';

const trailer: TmdbVideo = {
  id: 'trailer',
  key: 'trailer-key',
  name: 'Official trailer',
  type: 'Trailer',
  site: 'YouTube',
  official: true,
  published_at: '',
  size: 1080,
  iso_639_1: 'en',
  iso_3166_1: 'US',
};

beforeEach(() => vi.clearAllMocks());

describe('Trailer and video entry point', () => {
  it.each(['movie', 'tv'] as const)(
    'combines %s videos into one trailer button without loading a player',
    async (mediaType) => {
      vi.mocked(getPdpExtras).mockResolvedValue({
        videos: {
          id: 1,
          results: [
            { ...trailer, id: 'extra', key: 'extra-key', type: 'Featurette' },
            trailer,
            { ...trailer, id: 'invalid', key: 'invalid?key' },
            { ...trailer, id: 'vimeo', site: 'Vimeo' },
          ],
        },
      });
      const section = await TrailerContent({ mediaType, mediaId: 1, title: 'Title' });
      const html = renderToStaticMarkup(section);
      expect(getPdpExtras).toHaveBeenCalledWith(mediaType, 1);
      expect(html).toContain('Play Trailer');
      expect(html).toContain('2 videos');
      expect(html).not.toContain('<iframe');
      expect(section?.props.videos[0].key).toBe('trailer-key');
    },
  );

  it('offers additional videos even when no trailer exists', async () => {
    vi.mocked(getPdpExtras).mockResolvedValue({
      videos: { id: 1, results: [{ ...trailer, type: 'Featurette' }] },
    });
    expect(
      renderToStaticMarkup(
        await TrailerContent({ mediaType: 'movie', mediaId: 1, title: 'Title' }),
      ),
    ).toContain('Watch Videos');
  });

  it('hides the button when there are no playable videos', async () => {
    vi.mocked(getPdpExtras).mockResolvedValue({});
    expect(await TrailerContent({ mediaType: 'tv', mediaId: 1, title: 'Title' })).toBeNull();
  });
});
