import 'server-only';
import type { CatalogTitleInput } from '@movies/api/catalog-support';
import { imdbIdSchema, type ImdbRatingReader } from '@movies/api/imdb';
import type { CatalogService } from '@movies/api/router';
import type { TmdbFetch } from '@movies/api/tmdb-fetch';
import { z } from 'zod';

const titleMatchSchema = z.object({ id: z.number().int().positive() });
const titleResultsSchema = z.object({
  movie_results: z.array(titleMatchSchema),
  tv_results: z.array(titleMatchSchema),
});
const externalIdsSchema = z.object({ imdb_id: imdbIdSchema.nullable().default(null) });
export type CatalogImdbOptions = {
  readRating?: ImdbRatingReader;
  onRatingError?: (error: unknown, input: CatalogTitleInput) => void;
};

export function createCatalogImdbService(
  fetchTmdb: TmdbFetch,
  options: CatalogImdbOptions = {},
): Pick<CatalogService, 'imdb' | 'resolveImdb'> {
  return {
    async resolveImdb({ imdbId }) {
      const results = titleResultsSchema.parse(
        await fetchTmdb(`/find/${imdbIdSchema.parse(imdbId)}`, {
          searchParams: { external_source: 'imdb_id' },
        }),
      );
      if (results.movie_results[0]) {
        return { id: results.movie_results[0].id, type: 'movie' };
      }
      if (results.tv_results[0]) {
        return { id: results.tv_results[0].id, type: 'tv' };
      }
      return null;
    },
    async imdb(input) {
      const data = externalIdsSchema.parse(
        await fetchTmdb<unknown>(`/${input.type}/${input.id}/external_ids`),
      );
      if (!data.imdb_id) {
        return { url: null, rating: null, ratingUnavailable: false };
      }
      const url = `https://www.imdb.com/title/${data.imdb_id}/`;
      if (!options.readRating) {
        return { url, rating: null, ratingUnavailable: false };
      }
      try {
        return { url, rating: await options.readRating(data.imdb_id), ratingUnavailable: false };
      } catch (error) {
        options.onRatingError?.(error, input);
        return { url, rating: null, ratingUnavailable: true };
      }
    },
  };
}
