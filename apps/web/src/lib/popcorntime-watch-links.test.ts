import { describe, expect, it } from 'vite-plus/test';

import type { RegionWatchProviders, WatchProvider } from '@/types/watch-provider';

import { buildPopcornTimeWatchLinks } from './popcorntime-watch-links';

const token = '3xK9mPv2bQ7nRtYs';
const link = {
  provider_id: 'netflix',
  addon_provider_id: null,
  link_token: token,
  price_types: ['flatrate'],
  platforms: ['web'],
  available_from: null,
  available_to: null,
};
const registry = {
  country: 'SE',
  providers: [{ id: 'netflix', name: 'Netflix', parent_id: null }],
};

function provider(id: number, name: string): WatchProvider {
  return { provider_id: id, provider_name: name, logo_path: '/logo.png', display_priority: 1 };
}
const availability: RegionWatchProviders = {
  link: 'https://www.themoviedb.org/movie/1/watch?locale=SE',
  flatrate: [
    provider(8, 'Netflix'),
    provider(119, 'Amazon Prime Video'),
    provider(350, 'Apple TV'),
  ],
  rent: [provider(2, 'Apple TV Store')],
  buy: [provider(2, 'Apple TV Store')],
};

function build(links: unknown = [link], providers: unknown = registry) {
  return buildPopcornTimeWatchLinks(providers, links, availability, 'SE', '2026-11-04');
}

describe('Popcorn Time offer matching', () => {
  it('uses a fixed redirect origin and scopes each offer to the requested country', () => {
    expect(build()).toEqual([
      {
        providerId: 8,
        regions: ['SE'],
        types: ['flatrate'],
        url: `https://popcorntime.app/go/${token}?platform=web`,
      },
    ]);
  });

  it('maps Prime aliases only to the regional provider and separates Apple store offers', () => {
    const providers = {
      country: 'SE',
      providers: [
        { id: 'prime', name: 'Prime Video', parent_id: null },
        { id: 'apple', name: 'Apple TV', parent_id: null },
      ],
    };
    const links = [
      { ...link, provider_id: 'prime' },
      { ...link, provider_id: 'apple', price_types: ['rent', 'buy'] },
    ];
    expect(build(links, providers).map((result) => [result.providerId, result.types])).toEqual([
      [119, ['flatrate']],
      [2, ['rent']],
      [2, ['buy']],
    ]);
  });

  it('matches Nordic provider names without guessing provider IDs from slugs', () => {
    const providers = { country: 'SE', providers: [{ id: 'v', name: 'Viaplay', parent_id: null }] };
    expect(
      buildPopcornTimeWatchLinks(
        providers,
        [{ ...link, provider_id: 'v' }],
        {
          link: availability.link,
          flatrate: [provider(76, 'Viaplay')],
        },
        'SE',
        '2026-11-04',
      )[0]?.providerId,
    ).toBe(76);
  });

  it.each([
    { addon_provider_id: 'showtime' },
    { provider_id: 'unknown' },
    { platforms: ['ios'] },
    { price_types: ['rent'] },
    { price_types: ['cinema', 'fast', 'flatrate_and_buy'] },
    { price_types: null },
    { available_from: '2026-11-05' },
    { available_to: '2026-11-04' },
    { available_to: '2026-11-03' },
    { available_to: 'invalid' },
    { link_token: '../../evil' },
    { link_token: 'https://evil.com' },
    { link_token: 'token?redirect=evil' },
    { link_token: 'short' },
    { link_token: '0'.repeat(20) },
  ])('rejects unsafe, unavailable, unsupported or mismatched offers: %j', (overrides) => {
    expect(build([{ ...link, ...overrides }])).toEqual([]);
  });

  it('accepts active dates and nullable platform metadata', () => {
    expect(
      build([
        { ...link, platforms: null, available_from: '2026-11-04', available_to: '2026-11-05' },
      ]),
    ).toHaveLength(1);
  });

  it('keeps a valid offer when another row is malformed', () => {
    expect(build([null, { bad: true }, link])).toHaveLength(1);
  });

  it('deduplicates quality variants but rejects conflicting destination tokens', () => {
    expect(build([link, link])).toHaveLength(1);
    expect(build([link, { ...link, link_token: '4xK9mPv2bQ7nRtYs' }])).toEqual([]);
  });

  it.each([
    null,
    { country: 'US', providers: registry.providers },
    { country: 'SE', providers: [{ ...registry.providers[0], parent_id: 'amazon' }] },
    { country: 'SE', providers: [...registry.providers, ...registry.providers] },
    { country: 'SE', providers: [null] },
  ])(
    'does not match unknown, ambiguous, child or wrong-country provider records: %j',
    (providers) => {
      expect(build([link], providers)).toEqual([]);
    },
  );

  it('requires a link array and does not reuse a base-service name for an ad tier', () => {
    expect(build({ links: [link] })).toEqual([]);
    expect(
      buildPopcornTimeWatchLinks(
        registry,
        [link],
        {
          link: availability.link,
          flatrate: [provider(1796, 'Netflix basic with Ads')],
        },
        'SE',
        '2026-11-04',
      ),
    ).toEqual([]);
  });

  it('rejects provider names matching multiple IDs in the same offer group', () => {
    expect(
      buildPopcornTimeWatchLinks(
        registry,
        [link],
        {
          link: availability.link,
          flatrate: [provider(8, 'Netflix'), provider(999, 'Netflix')],
        },
        'SE',
        '2026-11-04',
      ),
    ).toEqual([]);
  });
});
