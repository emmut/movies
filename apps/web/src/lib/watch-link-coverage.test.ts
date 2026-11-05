import { describe, expect, it } from 'vite-plus/test';

import { summarizeWatchLinkCoverage, type WatchLinkAuditRow } from './watch-link-coverage';

const offer = { providerId: 8, providerName: 'Netflix', type: 'flatrate' as const, direct: true };
function row(
  status: WatchLinkAuditRow['status'],
  offers: WatchLinkAuditRow['offers'],
): WatchLinkAuditRow {
  return { resource: 'movie/1', title: 'Film', status, offers };
}

describe('watch-link coverage measurement', () => {
  it('distinguishes one linked title from the proportion of provider/offer buttons that link directly', () => {
    const result = summarizeWatchLinkCoverage([
      row('resolved', [
        offer,
        { ...offer, type: 'rent', direct: false },
        { ...offer, providerId: 426, providerName: 'SF Anytime', direct: false },
      ]),
    ]);
    expect(result.offerHitRate).toBe(1 / 3);
    expect(result.titleHitRate).toBe(1);
    expect(result.providers[0]).toEqual({ providerId: 8, name: 'Netflix', offers: 2, direct: 1 });
  });
  it('does not misreport request failures as missing catalogue data', () => {
    const result = summarizeWatchLinkCoverage([
      row('lookup_failed', [offer]),
      row('missing_item', [{ ...offer, direct: false }]),
    ]);
    expect(result.lookupFailures).toBe(1);
    expect(result.unmeasuredOffers).toBe(1);
    expect(result.measuredOffers).toBe(1);
    expect(result.offerHitRate).toBe(0);
  });
  it('reports unknown rates when every lookup fails or no regional offers exist', () => {
    expect(summarizeWatchLinkCoverage([row('lookup_failed', [offer])]).offerHitRate).toBeNull();
    expect(summarizeWatchLinkCoverage([row('resolved', [])]).titleHitRate).toBeNull();
    expect(summarizeWatchLinkCoverage([]).offerHitRate).toBeNull();
  });
});
