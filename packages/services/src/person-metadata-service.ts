import 'server-only';
import {
  personMetadataSchema,
  personMovieCreditsSchema,
  personTvCreditsSchema,
  type PersonMetadataService,
} from '@movies/api/metadata';
import type { TmdbFetch } from '@movies/api/tmdb-fetch';

import { createResourceReader } from './resource-reader';

export function createPersonMetadataService(fetchTmdb: TmdbFetch): PersonMetadataService {
  const resource = createResourceReader(fetchTmdb);
  return {
    async profile({ id }) {
      return resource(`/person/${id}`, personMetadataSchema, id);
    },
    async movieCredits({ id }) {
      return resource(`/person/${id}/movie_credits`, personMovieCreditsSchema, id);
    },
    async tvCredits({ id }) {
      return resource(`/person/${id}/tv_credits`, personTvCreditsSchema, id);
    },
  };
}
