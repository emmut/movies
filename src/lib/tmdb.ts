import 'server-only';
import { env } from '@/env';
import { buildProxyImageUrls } from '@/lib/imgproxy-url';

import { TMDB_API_URL } from './constants';

type TmdbSearchParams = Record<string, string | number | undefined>;

type TmdbFetchOptions = {
  searchParams?: TmdbSearchParams;
  errorMessage?: string;
};

/**
 * Fetches a TMDb API endpoint with authorization and JSON parsing.
 *
 * @param path - The API path (e.g. '/movie/123' or '/trending/movie/day').
 * @param searchParams - Optional query parameters; `undefined` values are skipped.
 * @param errorMessage - Error message thrown on a non-OK response.
 * @returns The parsed JSON response.
 *
 * @throws If the response status is not OK.
 */
export async function tmdbFetch<T>(
  path: string,
  { searchParams, errorMessage }: TmdbFetchOptions = {},
): Promise<T> {
  const url = new URL(`${TMDB_API_URL}${path}`);

  for (const [key, value] of Object.entries(searchParams ?? {})) {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  }

  const res = await fetch(url, {
    headers: {
      authorization: `Bearer ${env.MOVIE_DB_ACCESS_TOKEN}`,
      accept: 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(errorMessage ?? `TMDb request failed: ${path} (${res.status})`);
  }

  return (await res.json()) as T;
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
