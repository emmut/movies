import type { WatchOfferType } from '@/types/watch-provider';

export type WatchLinkAuditRow = {
  resource: string;
  title: string;
  status: 'resolved' | 'missing_item' | 'lookup_failed';
  offers: { providerId: number; providerName: string; type: WatchOfferType; direct: boolean }[];
};

/** Count actual regional offer buttons; adapter count and title-level success are different metrics. */
export function summarizeWatchLinkCoverage(rows: WatchLinkAuditRow[]) {
  const measured = rows.filter((row) => row.status !== 'lookup_failed');
  const offers = measured.flatMap((row) => row.offers);
  const titlesWithOffers = measured.filter((row) => row.offers.length > 0);
  const providers = new Map<
    number,
    { providerId: number; name: string; offers: number; direct: number }
  >();
  for (const offer of offers) {
    const item = providers.get(offer.providerId) ?? {
      providerId: offer.providerId,
      name: offer.providerName,
      offers: 0,
      direct: 0,
    };
    item.offers += 1;
    item.direct += Number(offer.direct);
    providers.set(offer.providerId, item);
  }
  const direct = offers.filter((offer) => offer.direct).length;
  return {
    titles: rows.length,
    completedLookups: measured.length,
    lookupFailures: rows.length - measured.length,
    unmeasuredOffers: rows
      .filter((row) => row.status === 'lookup_failed')
      .flatMap((row) => row.offers).length,
    measuredOffers: offers.length,
    directOffers: direct,
    offerHitRate: offers.length ? direct / offers.length : null,
    titleHitRate: titlesWithOffers.length
      ? titlesWithOffers.filter((row) => row.offers.some((offer) => offer.direct)).length /
        titlesWithOffers.length
      : null,
    providers: [...providers.values()].sort((a, b) => b.offers - a.offers),
  };
}
