import 'server-only';
import { env } from '@/env';
import { buildProxyImageUrls } from '@/lib/imgproxy-url';

import { createTmdbFetch } from './tmdb-fetch';

/**
 * Fetches a TMDb API endpoint with authorization and JSON parsing, bound to
 * the app's access token. See {@link createTmdbFetch} for retry semantics.
 *
 * @param path - The API path (e.g. '/movie/123' or '/trending/movie/day').
 * @param searchParams - Optional query parameters; `undefined` values are skipped.
 * @param errorMessage - Error message thrown on a non-OK response.
 * @returns The parsed JSON response.
 *
 * @throws {TmdbRequestError} If the response status is not OK.
 */
export const tmdbFetch = createTmdbFetch(env.MOVIE_DB_ACCESS_TOKEN);

/**
 * Degrades an optional TMDb fetch to `fallback` when it fails, so a single
 * flaky endpoint (a transient 504, an exhausted retry) hides one section
 * instead of crashing the whole page. Apply it at the call site — outside the
 * `use cache` fetcher — so the failure is never cached and the next request
 * retries.
 */
export async function optional<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await promise;
  } catch (error) {
    console.error('Optional TMDb fetch failed; rendering fallback:', error);
    return fallback;
  }
}

export function addPosterImageUrls<T extends { poster_path: string | null }>(item: T) {
  if (!item.poster_path) {
    return item;
  }

  return {
    ...item,
    posterImageUrls: buildProxyImageUrls(item.poster_path, {
      width: 500,
      fill: true,
    }),
  };
}

export function addProfileImageUrls<T extends { profile_path: string | null }>(item: T) {
  if (!item.profile_path) {
    return item;
  }

  return {
    ...item,
    profileImageUrls: buildProxyImageUrls(item.profile_path, {
      width: 500,
      fill: true,
    }),
  };
}
