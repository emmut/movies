import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

vi.mock('nuqs', async (importOriginal) => ({
  ...(await importOriginal<typeof import('nuqs')>()),
  useQueryState: vi.fn(() => ['US']),
}));
vi.mock('@/components/region-select', () => ({ RegionSelect: () => null }));
vi.mock('@/lib/utils', () => ({ formatImageUrl: () => 'https://image.tmdb.org/logo.png' }));

import { useQueryState } from 'nuqs';

import type {
  PopcornTimeAvailability,
  ResolvedWatchLink,
  StreamingOffer,
  StreamingOfferType,
  WatchOfferType,
} from '@/types/watch-provider';

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
const primary: StreamingOffer = {
  providerId: 'popcorntime::new',
  providerName: 'New service',
  via: null,
  logo: null,
  type: 'flatrate',
  url: 'https://popcorntime.app/go/3xK9mPv2bQ7nRtYs',
  source: 'popcorntime',
  availabilitySource: 'popcorntime',
};

function render(
  links: ResolvedWatchLink[] = [],
  type: WatchOfferType = 'flatrate',
  popcornTime: PopcornTimeAvailability | undefined = undefined,
  includeTmdb = true,
) {
  return renderToStaticMarkup(
    <StreamingProviders
      watchProviders={{
        results: includeTmdb
          ? {
              US: {
                link: 'https://www.themoviedb.org/movie/1/watch?locale=US',
                [type]: [provider],
              },
            }
          : {},
      }}
      directLinks={links}
      popcornTime={popcornTime}
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

  it('shows a provider with no TMDB entry or logo', () => {
    const html = render([], 'flatrate', { region: 'US', offers: [primary] }, false);
    expect(html).toContain(`href="${primary.url}"`);
    expect(html).toContain('Watch on New service');
    expect(html).toContain('Popcorn Time');
    expect(html).not.toContain('No services available');
  });

  it('uses Popcorn Time for matching offers and hides unused Wikidata credit', () => {
    const html = render([offer], 'flatrate', {
      region: 'US',
      offers: [{ ...primary, providerName: 'Netflix' }],
    });
    expect(html).toContain(`href="${primary.url}"`);
    expect(html).not.toContain(offer.url);
    expect(html).not.toContain('Wikidata');
    expect(html).toContain('JustWatch');
  });

  it('keeps independent providers and credits Wikidata when used as a fallback', () => {
    const html = render([offer], 'flatrate', { region: 'US', offers: [primary] });
    expect(html).toContain(`href="${primary.url}"`);
    expect(html).toContain(`href="${offer.url}"`);
    expect(html).toContain('Wikidata');
    expect(html).toContain('Popcorn Time');
  });

  it('shows channel hosts and ad tiers separately from standalone subscriptions', () => {
    const html = render(
      [],
      'flatrate',
      {
        region: 'US',
        offers: [
          primary,
          { ...primary, providerId: 'channel', via: 'Prime Video' },
          { ...primary, providerId: 'ad-tier', providerName: 'New service with ads', type: 'ads' },
        ],
      },
      false,
    );
    expect(html).toContain('Watch on New service via Prime Video');
    expect(html).toContain('Watch on New service with ads');
    expect(html).toContain('>New service</span>');
    expect(html).toContain('Free with ads');
  });

  it.each([
    ['free', 'Free', 'Watch'],
    ['ads', 'Free with ads', 'Watch'],
    ['flatrate', 'Streaming', 'Watch'],
    ['rent', 'Rent', 'Rent'],
    ['buy', 'Buy', 'Buy'],
    ['cinema', 'Cinema', 'Get tickets'],
    ['fast', 'Live channels', 'Open'],
    ['flatrate_and_buy', 'Subscription or purchase', 'View options'],
    ['other', 'Other options', 'View options'],
  ] satisfies [StreamingOfferType, string, string][])(
    'renders %s offers with the correct group and action',
    (type, heading, action) => {
      const html = render([], 'flatrate', { region: 'US', offers: [{ ...primary, type }] }, false);
      expect(html).toContain(heading);
      expect(html).toContain(`${action} on New service`);
      expect(html).not.toContain('No services available');
    },
  );

  it('does not reuse Popcorn Time offers from another region', () => {
    const html = render([offer], 'flatrate', { region: 'SE', offers: [primary] });
    expect(html).toContain(`href="${offer.url}"`);
    expect(html).not.toContain(primary.url);
    expect(html).not.toContain('Popcorn Time');
  });

  it('does not reuse links after region changes', () => {
    vi.mocked(useQueryState).mockReturnValue(['SE', vi.fn()]);
    const html = render([offer], 'flatrate', { region: 'US', offers: [primary] });
    expect(html).not.toContain(offer.url);
    expect(html).not.toContain(primary.url);
    expect(html).toContain('No services available');
    expect(html).toContain('locale=SE');
  });

  it.each(['free', 'ads'] as const)('shows %s-only TMDB availability', (type) => {
    expect(render([], type)).not.toContain('No services available');
  });

  it.each([
    ['rent', 'Rent'],
    ['buy', 'Buy'],
  ] as const)('labels %s links accurately', (type, action) => {
    expect(render([{ ...offer, types: [type] }], type)).toContain(`${action} on Netflix`);
    expect(render([offer], type)).toContain('View options on TMDB');
  });
});
