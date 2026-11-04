import { describe, expect, it } from 'vite-plus/test';

import type { ResolvedWatchLink, StreamingOffer } from '@/types/watch-provider';

import { getStreamingOffers } from './streaming-offers';

const primary: StreamingOffer = {
  providerId: 'popcorntime::new-service',
  providerName: 'New Service',
  via: null,
  logo: null,
  type: 'flatrate',
  url: 'https://popcorntime.app/go/3xK9mPv2bQ7nRtYs',
  source: 'popcorntime',
  availabilitySource: 'popcorntime',
};
const provider = {
  provider_id: 8,
  provider_name: 'Netflix',
  logo_path: '/n.png',
  display_priority: 1,
};
const availability = { link: 'https://www.themoviedb.org/movie/1/watch', flatrate: [provider] };
const fallback: ResolvedWatchLink = {
  source: 'wikidata',
  providerId: 8,
  types: ['flatrate'],
  url: 'https://www.netflix.com/title/80057281',
};
const watchUrl = availability.link;

describe('streaming source merging', () => {
  it('shows new Popcorn Time providers when TMDB has no availability at all', () => {
    expect(
      getStreamingOffers({ region: 'SE', offers: [primary] }, undefined, [], 'SE', watchUrl),
    ).toEqual([primary]);
  });

  it('keeps Popcorn Time-only services and fills additional TMDB offers with Wikidata links', () => {
    const offers = getStreamingOffers(
      { region: 'SE', offers: [primary] },
      availability,
      [fallback],
      'SE',
      watchUrl,
    );
    expect(offers.map((offer) => [offer.providerName, offer.source])).toEqual([
      ['New Service', 'popcorntime'],
      ['Netflix', 'wikidata'],
    ]);
  });

  it('prefers the primary source for matching service names and offer types only', () => {
    const netflix = { ...primary, providerName: 'Netflix' };
    const offers = getStreamingOffers(
      { region: 'SE', offers: [netflix] },
      {
        ...availability,
        rent: [provider],
      },
      [fallback],
      'SE',
      watchUrl,
    );
    expect(offers).toHaveLength(2);
    expect(offers[0]).toEqual(netflix);
    expect(offers[1]).toMatchObject({ type: 'rent', source: 'tmdb', url: watchUrl });
  });

  it('does not merge standalone services into channel bundles or ad tiers', () => {
    const channel = { ...primary, providerName: 'Netflix', via: 'Prime Video' };
    const adTier = { ...primary, providerName: 'Netflix with Ads' };
    expect(
      getStreamingOffers(
        { region: 'SE', offers: [channel, adTier] },
        availability,
        [fallback],
        'SE',
        watchUrl,
      ),
    ).toHaveLength(3);
  });

  it('rejects previous-market primary offers and respects fallback link market restrictions', () => {
    const offers = getStreamingOffers(
      { region: 'US', offers: [primary] },
      availability,
      [{ ...fallback, regions: ['US'] }],
      'SE',
      watchUrl,
    );
    expect(offers).toHaveLength(1);
    expect(offers[0]).toMatchObject({ source: 'tmdb', url: watchUrl });
  });

  it.each([null, undefined, { region: 'SE', offers: [] }])(
    'keeps TMDB/Wikidata when the primary source is unavailable: %j',
    (popcornTime) => {
      expect(
        getStreamingOffers(popcornTime, availability, [fallback], 'SE', watchUrl)[0],
      ).toMatchObject({ source: 'wikidata', availabilitySource: 'tmdb', url: fallback.url });
    },
  );

  it('does not collapse different non-Latin provider names', () => {
    const japanese = { ...primary, providerName: '日本映画' };
    const offers = getStreamingOffers(
      { region: 'SE', offers: [japanese] },
      {
        ...availability,
        flatrate: [{ ...provider, provider_name: '中文电影' }],
      },
      [],
      'SE',
      watchUrl,
    );
    expect(offers).toHaveLength(2);
  });
});
