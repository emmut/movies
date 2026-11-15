import type { DiscoveryInput } from '@movies/api/discover';
import { discoveryInputFromParams } from '@movies/api/discovery-input';

export type DiscoverMediaParams = {
  mediaType: 'movie' | 'tv';
  genreIds: number[];
  keywordIds: number[];
  companyIds?: number[];
  networkIds?: number[];
  page: number;
  sortBy?: string;
  watchProviders?: string;
  watchRegion?: string;
  runtimeLte?: number;
  originCountry?: string;
};

export function webDiscoveryInput(params: DiscoverMediaParams): DiscoveryInput {
  return discoveryInputFromParams(params.mediaType, {
    genreIds: params.genreIds,
    keywordIds: params.keywordIds,
    companyIds: params.companyIds,
    networkIds: params.networkIds,
    page: params.page,
    sortBy: params.sortBy,
    watchProviders: params.watchProviders,
    watchRegion: params.watchRegion,
    withRuntimeLte: params.runtimeLte,
    withOriginCountry: params.originCountry,
  });
}
