import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
vi.mock('@/components/image-proxy', () => ({ Imgproxy: () => null }));
vi.mock('@/lib/pdp', () => ({ getPdpExtras: vi.fn() }));
import { getPdpExtras } from '@/lib/pdp';

import { PdpAdditionalContent } from './pdp-extras';

beforeEach(() => vi.clearAllMocks());
describe('additional PDP content', () => {
  it('hides empty or missing appended responses', async () => {
    vi.mocked(getPdpExtras).mockResolvedValue({});
    const html = renderToStaticMarkup(
      await PdpAdditionalContent({ type: 'movie', id: 1, region: 'SE' }),
    );
    expect(html).not.toContain('<section');
    expect(html).not.toContain('<details');
  });
  it('uses regional release dates without substituting a different country and removes duplicates', async () => {
    vi.mocked(getPdpExtras).mockResolvedValue({
      release_dates: {
        id: 1,
        results: [
          {
            iso_3166_1: 'US',
            release_dates: [
              { type: 3, release_date: '2020-01-01', certification: '', iso_639_1: '' },
            ],
          },
          {
            iso_3166_1: 'SE',
            release_dates: [
              { type: 4, release_date: '2020-03-01', certification: '', iso_639_1: '' },
              { type: 4, release_date: '2020-03-01', certification: '', iso_639_1: '' },
            ],
          },
        ],
      },
    });
    const html = renderToStaticMarkup(
      await PdpAdditionalContent({ type: 'movie', id: 1, region: 'SE' }),
    );
    expect(html).toContain('Digital');
    expect(html).not.toContain('2020-01-01');
    expect(html.match(/<li /g)).toHaveLength(1);
  });
  it.each(['movie', 'tv'] as const)(
    'links %s keywords to discovery and hides spoilers by default',
    async (type) => {
      vi.mocked(getPdpExtras).mockResolvedValue({
        keywords:
          type === 'movie'
            ? { keywords: [{ id: 10, name: 'Time travel' }] }
            : { results: [{ id: 10, name: 'Time travel' }] },
      });
      const html = renderToStaticMarkup(await PdpAdditionalContent({ type, id: 1, region: 'SE' }));
      expect(html).toContain(`/keyword/10?mediaType=${type}`);
      expect(html).toContain('<details');
      expect(html).not.toContain('open=""');
    },
  );
  it('hides unsupported video hosts and invalid YouTube keys', async () => {
    const video = {
      id: '1',
      key: 'valid-key',
      name: 'Featurette',
      type: 'Featurette',
      site: 'YouTube',
      official: true,
      published_at: '',
      size: 1080,
      iso_639_1: 'en',
      iso_3166_1: 'US',
    };
    vi.mocked(getPdpExtras).mockResolvedValue({
      videos: {
        id: 1,
        results: [
          video,
          { ...video, id: '2', site: 'Vimeo', name: 'Unsupported' },
          { ...video, id: '3', key: 'bad?key', name: 'Invalid' },
        ],
      },
    });
    const html = renderToStaticMarkup(
      await PdpAdditionalContent({ type: 'movie', id: 1, region: 'SE' }),
    );
    expect(html).toContain('https://www.youtube.com/watch?v=valid-key');
    expect(html).not.toContain('Unsupported');
    expect(html).not.toContain('Invalid');
  });
});
