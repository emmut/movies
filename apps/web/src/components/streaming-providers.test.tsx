import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

vi.mock('nuqs', async (importOriginal) => ({
  ...(await importOriginal<typeof import('nuqs')>()),
  useQueryState: vi.fn(() => ['US']),
}));
vi.mock('@/components/region-select', () => ({ RegionSelect: () => null }));
vi.mock('@/lib/utils', () => ({ formatImageUrl: () => 'https://image.tmdb.org/logo.png' }));

import { useQueryState } from 'nuqs';

import { buildWikidataWatchLinks } from '@/lib/wikidata-watch-links';
import type { ResolvedWatchLink, WatchOfferType } from '@/types/watch-provider';

import { StreamingProviders } from './streaming-providers';

const provider = {
  provider_id: 8,
  provider_name: 'Netflix',
  logo_path: '/logo.png',
  display_priority: 1,
};
const offer: ResolvedWatchLink = {
  source: 'wikidata',
  providerId: 8,
  types: ['flatrate'],
  url: 'https://www.netflix.com/title/123',
};

function render(offers: ResolvedWatchLink[] = [], type: WatchOfferType = 'flatrate') {
  return renderToStaticMarkup(
    <StreamingProviders
      watchProviders={{
        results: {
          US: { link: 'https://www.themoviedb.org/movie/1/watch?locale=US', [type]: [provider] },
        },
      }}
      directLinks={offers}
      resourceId={1}
      resourceType="movie"
      userRegion="US"
    />,
  );
}

beforeEach(() => vi.mocked(useQueryState).mockReturnValue(['US', vi.fn()]));

describe('streaming provider destinations', () => {
  it.each([
    ['US', 'US'],
    ['GB', 'UK'],
  ] as const)(
    'labels a %s fallback while keeping local availability and attribution',
    (fallbackRegion, country) => {
      vi.mocked(useQueryState).mockReturnValue(['SE', vi.fn()]);
      const html = renderToStaticMarkup(
        <StreamingProviders
          watchProviders={{
            results: {
              SE: {
                link: 'https://www.themoviedb.org/movie/1/watch?locale=SE',
                flatrate: [provider],
              },
            },
          }}
          directLinks={[{ ...offer, regions: ['SE'], fallbackRegion }]}
          resourceId={1}
          resourceType="movie"
          userRegion="SE"
        />,
      );
      expect(html).toContain(`Watch on Netflix (${country} catalogue)`);
      expect(html).toContain('US/UK catalogue links may have different availability or prices.');
      expect(html).toContain('locale=SE');
      expect(html).toContain('JustWatch');
      expect(html).toContain('Wikidata');
    },
  );
  it('credits only the winning source for an actual displayed offer', () => {
    const homepage = { ...offer, source: 'tmdb-homepage' as const };
    const html = render([homepage, offer]);
    expect(html).toContain(offer.url);
    expect(html).toContain('JustWatch');
    expect(html).toContain('TMDB');
    expect(html).not.toContain('Wikidata');
    expect(render([{ ...offer, providerId: 999 }])).not.toContain('Wikidata');
  });

  it('credits Apple when its store destination is used and preserves availability attribution', () => {
    const html = renderToStaticMarkup(
      <StreamingProviders
        watchProviders={{
          results: {
            US: {
              link: 'https://www.themoviedb.org/movie/1/watch',
              buy: [{ ...provider, provider_id: 2, provider_name: 'Apple TV Store' }],
            },
          },
        }}
        directLinks={[
          {
            providerId: 2,
            types: ['rent', 'buy'],
            source: 'apple',
            regions: ['US'],
            url: 'https://itunes.apple.com/us/movie/id1735930123',
          },
        ]}
        resourceId={1}
        resourceType="movie"
        userRegion="US"
      />,
    );
    expect(html).toContain('Buy on Apple TV Store');
    expect(html).toContain('https://www.apple.com/apple-tv-app/');
    expect(html).toContain('JustWatch');
    expect(html).toContain('View all watch options on TMDB');
    expect(html).not.toContain('Wikidata');
  });
  it('links directly and credits both availability and link sources', () => {
    const html = render([offer]);
    expect(html).toContain(`href="${offer.url}"`);
    expect(html).toContain('Watch on Netflix');
    expect(html).toContain('JustWatch');
    expect(html).toContain('TMDB');
    expect(html).toContain('Wikidata');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it('labels missing direct links as TMDB options and hides unused Wikidata attribution', () => {
    const html = render();
    expect(html).toContain('View options on TMDB');
    expect(html).not.toContain('Watch on Netflix');
    expect(html).not.toContain('Wikidata');
  });

  it('does not reuse links from a different region after region changes', () => {
    vi.mocked(useQueryState).mockReturnValue(['SE', vi.fn()]);
    const html = render([offer]);
    expect(html).not.toContain(offer.url);
    expect(html).toContain('No services available');
    expect(html).toContain('locale=SE');
  });

  it.each(['free', 'ads'] as const)(
    'does not show an empty state for %s-only availability',
    (type) => {
      const html = render([], type);
      expect(html).toContain('Netflix');
      expect(html).not.toContain('No services available');
    },
  );

  it.each([
    ['rent', 'Rent'],
    ['buy', 'Buy'],
  ] as const)('labels %s links accurately', (type, action) => {
    expect(render([{ ...offer, types: [type] }], type)).toContain(`${action} on Netflix`);
    expect(render([offer], type)).toContain('View options on TMDB');
  });

  it('renders expanded Nordic and international links only for reported TMDB offers', () => {
    vi.mocked(useQueryState).mockReturnValue(['SE', vi.fn()]);
    function item(value: string, datatype = 'external-id') {
      return { rank: 'normal', mainsnak: { snaktype: 'value', datatype, datavalue: { value } } };
    }
    const links = buildWikidataWatchLinks(
      {
        P14440: [item('0PKD430VQU4ALLISBLIAGREZ99')],
        P1874: [item('80057281')],
        P6817: [item('my-film')],
        P7299: [item('114')],
        P856: [item('https://www.sfanytime.com/sv/movie/my-film', 'url')],
      },
      'movie',
      'SE',
      '2026-11-05',
    );
    function entry(id: number, name: string) {
      return { ...provider, provider_id: id, provider_name: name };
    }
    const html = renderToStaticMarkup(
      <StreamingProviders
        watchProviders={{
          results: {
            SE: {
              link: 'https://www.themoviedb.org/movie/1/watch?locale=SE',
              flatrate: [
                entry(119, 'Amazon Prime Video'),
                entry(1796, 'Netflix Standard with Ads'),
                entry(201, 'MUBI Amazon Channel'),
              ],
              free: [entry(493, 'SVT Play')],
              rent: [entry(426, 'SF Anytime')],
            },
          },
        }}
        directLinks={links.map((link) => ({ ...link, source: 'wikidata' as const }))}
        resourceId={1}
        resourceType="movie"
        userRegion="SE"
      />,
    );
    expect(html).toContain('Watch on Amazon Prime Video');
    expect(html).toContain('Watch on Netflix Standard with Ads');
    expect(html).toContain('Watch on SVT Play');
    expect(html).toContain('Rent on SF Anytime');
    expect(html).toContain('View options on TMDB for MUBI Amazon Channel');
    expect(html).not.toContain('https://mubi.com/films/114');
    expect(html).toContain('JustWatch');
    expect(html).toContain('Wikidata');
  });

  it('keeps a regional TMDB offer visible while the previous country’s links are discarded', () => {
    vi.mocked(useQueryState).mockReturnValue(['SE', vi.fn()]);
    const html = renderToStaticMarkup(
      <StreamingProviders
        watchProviders={{
          results: {
            SE: {
              link: 'https://www.themoviedb.org/movie/1/watch?locale=SE',
              flatrate: [provider],
            },
          },
        }}
        directLinks={[{ ...offer, regions: ['US'] }]}
        resourceId={1}
        resourceType="movie"
        userRegion="US"
      />,
    );
    expect(html).toContain('Netflix');
    expect(html).toContain('View options on TMDB');
    expect(html).not.toContain(offer.url);
    expect(html).not.toContain('Wikidata');
  });
});
