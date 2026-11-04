import { describe, expect, it } from 'vite-plus/test';

import { buildPopcornTimeAvailability } from './popcorntime-watch-links';

const token = '3xK9mPv2bQ7nRtYs';
const link = {
  provider_id: 'netflix',
  addon_provider_id: null,
  link_token: token,
  price_types: ['flatrate'],
  available_from: null,
  available_to: null,
};
const registry = {
  country: 'SE',
  providers: [
    {
      id: 'netflix',
      name: 'Netflix',
      parent_id: null,
      logo: 'https://images.example.com/netflix.png',
    },
  ],
};
function build(links: unknown = [link], providers: unknown = registry) {
  return buildPopcornTimeAvailability(providers, links, 'SE', '2026-11-04');
}

describe('Popcorn Time provider coverage', () => {
  it('builds web offers from registry data without a TMDB provider crosswalk', () => {
    expect(build()).toEqual({
      region: 'SE',
      offers: [
        {
          providerId: 'popcorntime::netflix',
          providerName: 'Netflix',
          via: null,
          logo: 'https://images.example.com/netflix.png',
          type: 'flatrate',
          url: `https://popcorntime.app/go/${token}`,
          source: 'popcorntime',
          availabilitySource: 'popcorntime',
        },
      ],
    });
  });

  it('supports every registered provider, including newly added Nordic and non-Latin services', () => {
    const providers = Array.from({ length: 100 }, (_, i) => ({
      id: `service-${i}`,
      name: i === 0 ? '日本の映画' : `New Nordic Service ${i}`,
      parent_id: null,
    }));
    const links = providers.map((provider) => ({ ...link, provider_id: provider.id }));
    const result = build(links, { country: 'SE', providers });
    expect(result.offers).toHaveLength(100);
    expect(result.offers.map((offer) => offer.providerName)).toEqual(
      providers.map((provider) => provider.name),
    );
  });

  it.each(['flatrate', 'rent', 'buy', 'free', 'ads', 'cinema', 'fast', 'flatrate_and_buy'])(
    'preserves the documented %s offer type',
    (type) => {
      expect(build([{ ...link, price_types: [type] }]).offers[0]?.type).toBe(type);
    },
  );

  it.each([null, [], ['future-model']])(
    'keeps unspecified pricing as Other options: %j',
    (price_types) => {
      expect(build([{ ...link, price_types }]).offers[0]?.type).toBe('other');
    },
  );

  it('uses web redirect tokens regardless of optional native-platform metadata', () => {
    expect(build([{ ...link, platforms: ['ios', 'android'] }]).offers[0]?.url).toBe(
      `https://popcorntime.app/go/${token}`,
    );
  });

  it('preserves standalone, ad-tier and channel providers as separate services', () => {
    const providers = [
      ...registry.providers,
      { id: 'netflix-ads', name: 'Netflix with Ads', parent_id: 'netflix' },
      { id: 'prime', name: 'Prime Video', parent_id: null },
      { id: 'mubi', name: 'MUBI', parent_id: null },
      { id: 'mubi-prime', name: 'MUBI Amazon Channel', parent_id: 'prime' },
    ];
    const links = [
      link,
      { ...link, provider_id: 'netflix-ads' },
      { ...link, provider_id: 'mubi' },
      { ...link, provider_id: 'mubi-prime' },
      { ...link, provider_id: 'prime', addon_provider_id: 'mubi' },
    ];
    const offers = build(links, { country: 'SE', providers }).offers;
    expect(offers.map((offer) => [offer.providerName, offer.via])).toEqual([
      ['Netflix', null],
      ['Netflix with Ads', 'Netflix'],
      ['MUBI', null],
      ['MUBI Amazon Channel', 'Prime Video'],
      ['MUBI', 'Prime Video'],
    ]);
    expect(new Set(offers.map((offer) => offer.providerId)).size).toBe(5);
  });

  it('rejects missing or contradictory channel-host relationships without dropping direct services', () => {
    const providers = [
      ...registry.providers,
      { id: 'channel', name: 'Channel', parent_id: 'another-host' },
      { id: 'orphan', name: 'Orphan', parent_id: 'missing' },
      { id: 'self', name: 'Self', parent_id: 'self' },
    ];
    const links = [
      link,
      { ...link, addon_provider_id: 'channel' },
      { ...link, addon_provider_id: 'missing' },
      { ...link, provider_id: 'orphan' },
      { ...link, provider_id: 'self' },
    ];
    expect(build(links, { country: 'SE', providers }).offers).toHaveLength(1);
  });

  it.each([
    { provider_id: 'missing' },
    { available_from: '2026-11-05' },
    { available_to: '2026-11-04' },
    { available_to: '2026-11-03' },
    { available_to: 'invalid' },
    { link_token: '../../evil' },
    { link_token: 'https://evil.com' },
    { link_token: 'token?redirect=evil' },
    { link_token: 'short' },
    { link_token: '0'.repeat(20) },
  ])('rejects malformed, unavailable or unknown-provider rows: %j', (overrides) => {
    expect(build([{ ...link, ...overrides }]).offers).toEqual([]);
  });

  it('keeps a valid offer alongside malformed rows and deduplicates identical tokens', () => {
    expect(build([null, { bad: true }, link, link]).offers).toHaveLength(1);
    expect(build([link, { ...link, link_token: '4xK9mPv2bQ7nRtYs' }]).offers).toHaveLength(2);
  });

  it.each([
    null,
    { country: 'US', providers: registry.providers },
    { country: 'SE', providers: [...registry.providers, ...registry.providers] },
    { country: 'SE', providers: [null] },
  ])('rejects invalid, wrong-country or ambiguous registries: %j', (providers) => {
    expect(build([link], providers).offers).toEqual([]);
  });

  it('requires a link array', () => {
    expect(build({ links: [link] }).offers).toEqual([]);
  });

  it.each([
    undefined,
    null,
    'invalid',
    'http://example.com/logo',
    'data:image/png;base64,x',
    'https://user:pass@example.com/logo',
  ])('renders providers even when a logo is missing or unsafe: %s', (logo) => {
    const result = build([link], {
      country: 'SE',
      providers: [{ ...registry.providers[0], logo }],
    });
    expect(result.offers).toHaveLength(1);
    expect(result.offers[0].logo).toBeNull();
  });
});
