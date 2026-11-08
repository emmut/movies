import 'server-only';
import { personCreditFields, sortPersonTitles } from '@movies/api/person-filmography';
import type { PersonService } from '@movies/api/router';
import { TmdbRequestError, type TmdbFetch } from '@movies/api/tmdb-fetch';
import { ORPCError } from '@orpc/server';
import { toMediaCard, tmdbImageUrl } from '@server/media-card';
import {
  personDetailsSchema,
  searchedMovieSchema,
  searchedTvSchema,
} from '@server/tmdb-search-model';
import { z } from 'zod';

function publicUrl(value: string | null) {
  if (!value) {
    return null;
  }
  try {
    const url = new URL(value);
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return url.toString();
    }
  } catch {
    return null;
  }
  return null;
}
export function createPersonService(fetchTmdb: TmdbFetch): PersonService {
  return {
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
          homepage: publicUrl(person.homepage),
          imdbUrl:
            person.imdb_id && /^nm\d+$/.test(person.imdb_id)
              ? 'https://www.imdb.com/name/' + person.imdb_id + '/'
              : null,
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
