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
// Cap each attempt so a hung upstream (TMDb behind CloudFront can sit on a
// request for ~30s before returning a 504) aborts quickly and either retries or
// falls back, instead of stalling the page render on a single slow endpoint.
const REQUEST_TIMEOUT_MS = 6000;
// Longest upstream-specified rate-limit window (Retry-After) we'll wait out. A
// window longer than this can't be ridden out within our attempt budget, so we
// surface the 429 immediately and let the caller degrade rather than fire more
// requests inside the still-open window (which only adds load and still fails).
const MAX_RETRY_AFTER_MS = 2000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Parses a `Retry-After` header (delta-seconds or an HTTP date) into a delay in
 * milliseconds, or null when it is absent or unparseable.
 */
function retryAfterMs(res: Response): number | null {
  const header = res.headers.get('retry-after');
  if (!header) {
    return null;
  }
  const seconds = Number(header);
  if (Number.isFinite(seconds)) {
    return Math.max(0, seconds * 1000);
  }
  const date = Date.parse(header);
  return Number.isNaN(date) ? null : Math.max(0, date - Date.now());
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
function isTimeout(error: unknown) {
  return error instanceof DOMException && error.name === 'TimeoutError';
}

async function fetchWithRetry(url: URL, init: RequestInit, attempt = 1): Promise<Response> {
  let backoffMs = RETRY_BASE_MS * attempt;

  try {
    // Fresh timeout signal per attempt.
    const res = await fetch(url, { ...init, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    if (isFinalResponse(res, attempt)) {
      return res;
    }
    // Honor an upstream Retry-After (429/503) instead of our own backoff:
    // retrying before the window closes just wastes an attempt inside it and
    // adds load. If the window is longer than we're willing to block, surface
    // the response now and let the caller degrade rather than retry into a wall.
    const retryAfter = retryAfterMs(res);
    if (retryAfter !== null) {
      if (retryAfter > MAX_RETRY_AFTER_MS) {
        return res;
      }
      backoffMs = retryAfter;
    }
  } catch (error) {
    // A timeout means the upstream is hanging (TMDb's CloudFront can sit on a
    // request for ~30s). Retrying just stacks more waiting, so fail fast and let
    // the caller degrade; only fast transient errors are worth another attempt.
    if (isTimeout(error) || attempt >= MAX_ATTEMPTS) {
      throw error;
    }
  }

  await sleep(backoffMs);
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
