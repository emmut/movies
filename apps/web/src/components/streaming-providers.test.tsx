import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

vi.mock('nuqs', async (importOriginal) => ({
  ...(await importOriginal<typeof import('nuqs')>()),
  useQueryState: vi.fn(() => ['US']),
}));
vi.mock('@/components/region-select', () => ({ RegionSelect: () => null }));
vi.mock('@/lib/utils', () => ({ formatImageUrl: () => 'https://image.tmdb.org/logo.png' }));

import { useQueryState } from 'nuqs';

import type { DirectWatchLink, WatchOfferType } from '@/types/watch-provider';

import { StreamingProviders } from './streaming-providers';

const provider = {
  provider_id: 8,
  provider_name: 'Netflix',
  logo_path: '/logo.png',
  display_priority: 1,
};
const offer: DirectWatchLink = {
  providerId: 8,
  types: ['flatrate'],
  url: 'https://www.netflix.com/title/123',
};

function render(offers: DirectWatchLink[] = [], type: WatchOfferType = 'flatrate') {
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
});
