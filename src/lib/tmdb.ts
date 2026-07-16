import 'server-only';
import { env } from '@/env';
import { buildProxyImageUrls } from '@/lib/imgproxy-url';

import { TMDB_API_URL } from './constants';

type TmdbSearchParams = Record<string, string | number | undefined>;

type TmdbFetchOptions = {
  searchParams?: TmdbSearchParams;
  errorMessage?: string;
};

// Transient upstream failures we retry rather than fail the page on: request
// timeout, rate limiting, and gateway/server errors. A single blip (common when
// CI hammers the API during a build) shouldn't tank a whole detail page.
const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504]);
const MAX_ATTEMPTS = 3;
const RETRY_BASE_MS = 250;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Whether this response is final — either usable or a non-retryable failure, or
 * we've exhausted our attempts and must surface whatever we got.
 */
function isFinalResponse(res: Response, attempt: number) {
  return res.ok || !RETRYABLE_STATUS.has(res.status) || attempt >= MAX_ATTEMPTS;
}

/**
 * Fetches with a small backoff retry on transient upstream failures (network
 * errors and retryable statuses). Returns the last response even if not OK; the
 * caller decides how to surface a non-OK status.
 */
async function fetchWithRetry(url: URL, init: RequestInit, attempt = 1): Promise<Response> {
  try {
    const res = await fetch(url, init);
    if (isFinalResponse(res, attempt)) {
      return res;
    }
  } catch (error) {
    if (attempt >= MAX_ATTEMPTS) {
      throw error;
    }
  }

  await sleep(RETRY_BASE_MS * attempt);
  return fetchWithRetry(url, init, attempt + 1);
}

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

  const res = await fetchWithRetry(url, {
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
