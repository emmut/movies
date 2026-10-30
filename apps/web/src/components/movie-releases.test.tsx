import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
vi.mock('@/lib/pdp', () => ({ getPdpExtras: vi.fn() }));
import { getPdpExtras } from '@/lib/pdp';

import { MovieReleases } from './movie-releases';

beforeEach(() => vi.clearAllMocks());
describe('Movie release dates', () => {
  it('hides unavailable release dates without breaking the page', async () => {
    vi.mocked(getPdpExtras).mockRejectedValue(new Error('Unavailable'));
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(await MovieReleases({ movieId: 1, region: 'SE' })).toBeNull();
    log.mockRestore();
  });
  it('hides empty or missing appended responses', async () => {
    vi.mocked(getPdpExtras).mockResolvedValue({});
    const html = renderToStaticMarkup(await MovieReleases({ movieId: 1, region: 'SE' }));
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
    const html = renderToStaticMarkup(await MovieReleases({ movieId: 1, region: 'SE' }));
    expect(html).toContain('Digital');
    expect(html).not.toContain('2020-01-01');
    expect(html.match(/<li /g)).toHaveLength(1);
  });
  it('leaves keywords to the main details section', async () => {
    vi.mocked(getPdpExtras).mockResolvedValue({
      keywords: { keywords: [{ id: 10, name: 'Time travel' }] },
    });
    const html = renderToStaticMarkup(await MovieReleases({ movieId: 1, region: 'SE' }));
    expect(html).not.toContain('Time travel');
    expect(html).not.toContain('/discover?keywordId=10');
  });
});
