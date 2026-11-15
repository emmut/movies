import { discoveryInput, type DiscoveryInput } from './discover';
import type { DiscoverParams } from './discover-params';

export function discoveryInputFromParams(
  type: 'movie' | 'tv',
  params: DiscoverParams,
): DiscoveryInput {
  return discoveryInput.parse({
    type,
    region: params.watchRegion,
    page: params.page,
    genreIds: params.genreIds,
    keywordIds: params.keywordIds,
    companyIds: params.companyIds,
    networkIds: params.networkIds,
    sortBy: params.sortBy,
    runtime: params.withRuntimeLte,
    providerIds: params.watchProviders?.split('|').filter(Boolean).map(Number),
    originCountries: params.withOriginCountry?.split('|').filter(Boolean),
  });
}
