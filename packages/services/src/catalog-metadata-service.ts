import 'server-only';
import {
  movieMetadataSchema,
  tvMetadataSchema,
  movieCreditMetadataSchema,
  tvCreditMetadataSchema,
  aggregateCreditMetadataSchema,
  availabilitySchema,
  externalIdsSchema,
  type CatalogMetadataService,
} from '@movies/api/metadata';
import type { TmdbFetch } from '@movies/api/tmdb-fetch';

import { createResourceReader } from './resource-reader';

/** Fixed resource operations only; callers cannot choose upstream paths. */
export function createCatalogMetadataService(fetchTmdb: TmdbFetch): CatalogMetadataService {
  const resource = createResourceReader(fetchTmdb);
  return {
    async movieDetails({ id }) {
      return resource(`/movie/${id}`, movieMetadataSchema, id);
    },
    async tvDetails({ id }) {
      return resource(`/tv/${id}`, tvMetadataSchema, id);
    },
    async movieCredits({ id }) {
      return resource(`/movie/${id}/credits`, movieCreditMetadataSchema, id);
    },
    async tvCredits({ id }) {
      return resource(`/tv/${id}/credits`, tvCreditMetadataSchema, id);
    },
    async aggregateCredits({ id }) {
      return resource(`/tv/${id}/aggregate_credits`, aggregateCreditMetadataSchema, id);
    },
    async availability({ id, type }) {
      return resource(`/${type}/${id}/watch/providers`, availabilitySchema, id);
    },
    async externalIds({ id, type }) {
      return resource(`/${type}/${id}/external_ids`, externalIdsSchema, id);
    },
  };
}
