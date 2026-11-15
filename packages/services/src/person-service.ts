import { personCreditFields, sortPersonTitles } from '@movies/api/person-filmography';
import 'server-only';
import type { PersonService } from '@movies/api/router';
import { TmdbRequestError, type TmdbFetch } from '@movies/api/tmdb-fetch';
import { publicWebUrl, toMediaCard, tmdbImageUrl } from '@movies/services/media-card';
import {
  personDetailsSchema,
  searchedMovieSchema,
  searchedTvSchema,
} from '@movies/services/tmdb-search-model';
import { ORPCError } from '@orpc/server';
import { z } from 'zod';

import { createPersonMetadataService } from './person-metadata-service';

const IMDB_PERSON_ID = /^nm\d+$/;

function imdbPersonUrl(imdbId: string | null | undefined) {
  if (!imdbId || !IMDB_PERSON_ID.test(imdbId)) {
    return null;
  }
  return `https://www.imdb.com/name/${imdbId}/`;
}

export function createPersonService(fetchTmdb: TmdbFetch): PersonService {
  return {
    ...createPersonMetadataService(fetchTmdb),
    async details({ id }) {
      try {
        const person = personDetailsSchema.parse(await fetchTmdb('/person/' + id));
        return {
          id: person.id,
          name: person.name,
          biography: person.biography,
          profileUrl: tmdbImageUrl(person.profile_path, 'w500'),
          birthday: person.birthday,
          deathday: person.deathday,
          birthplace: person.place_of_birth,
          department: person.known_for_department,
          aliases: person.also_known_as,
          popularity: person.popularity,
          homepage: publicWebUrl(person.homepage),
          imdbUrl: imdbPersonUrl(person.imdb_id),
        };
      } catch (error) {
        if (error instanceof TmdbRequestError && error.status === 404) {
          throw new ORPCError('NOT_FOUND');
        }
        throw error;
      }
    },
    async credits({ id, type }) {
      const response = await fetchTmdb('/person/' + id + '/' + type + '_credits');
      // Credit entries carry no media_type; validate against the requested endpoint.
      const fields = {
        character: z.string().optional(),
        order: z.number().int().nonnegative().optional(),
        episode_count: z.number().int().nonnegative().optional(),
      };
      const schema =
        type === 'movie' ? searchedMovieSchema.extend(fields) : searchedTvSchema.extend(fields);
      const data = z.object({ cast: z.array(schema) }).parse(response);
      return sortPersonTitles(
        data.cast.map((item) => ({
          ...personCreditFields(item, type),
          ...toMediaCard(item, type),
          genreIds: item.genre_ids,
          voteCount: item.vote_count,
          popularity: item.popularity,
        })),
      );
    },
  };
}
