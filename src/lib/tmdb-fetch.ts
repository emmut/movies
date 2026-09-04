// No 'server-only' here: the nightly title sync (scripts/sync-titles.ts) runs
// under tsx outside the Next.js server runtime and needs the same client.
// The app-facing wrapper in `tmdb.ts` binds the token from `@/env`.

import { TMDB_API_URL } from './constants';

type TmdbSearchParams = Record<string, string | number | undefined>;

export type TmdbFetchOptions = {
  searchParams?: TmdbSearchParams;
  errorMessage?: string;
};

export type TmdbFetch = <T>(path: string, options?: TmdbFetchOptions) => Promise<T>;

/**
 * A non-OK TMDB response. Carries the HTTP status so callers can tell a
 * title that no longer exists (404) from an outage.
 */
export class TmdbRequestError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'TmdbRequestError';
    this.status = status;
  }
}

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
// Longest upstream-specified rate-limit window (Retry-After) we'll wait out,
// aligned with REQUEST_TIMEOUT_MS: a render already tolerates that long on a
// single attempt, so common short windows (Retry-After: 3–5) are worth riding
// out instead of failing the page. Anything longer can't be ridden out within
// a render, so we surface the 429 immediately and let the caller degrade
// rather than fire more requests inside the still-open window (which only
// adds load and still fails).
const MAX_RETRY_AFTER_MS = REQUEST_TIMEOUT_MS;
// Total budget for one fetch including retry waits. Per-attempt caps alone
// still stack: three 6s attempts plus two 6s Retry-After waits is ~30s, enough
// to hit the deployment's request deadline instead of rendering a degraded
// page. Once a retry wait would cross this deadline we surface what we have.
const RETRY_BUDGET_MS = 2 * REQUEST_TIMEOUT_MS;

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

function isTimeout(error: unknown) {
  return error instanceof DOMException && error.name === 'TimeoutError';
}

/**
 * Fetches with a small backoff retry on transient upstream failures (network
 * errors and retryable statuses). Returns the last response even if not OK; the
 * caller decides how to surface a non-OK status.
 */
async function fetchWithRetry(
  url: URL,
  init: RequestInit,
  attempt = 1,
  deadline = Date.now() + RETRY_BUDGET_MS,
): Promise<Response> {
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
    if (Date.now() + backoffMs > deadline) {
      return res;
    }
  } catch (error) {
    // A timeout means the upstream is hanging (TMDb's CloudFront can sit on a
    // request for ~30s). Retrying just stacks more waiting, so fail fast and let
    // the caller degrade; only fast transient errors are worth another attempt.
    if (isTimeout(error) || attempt >= MAX_ATTEMPTS || Date.now() + backoffMs > deadline) {
      throw error;
    }
  }

  await sleep(backoffMs);
  return fetchWithRetry(url, init, attempt + 1, deadline);
}

/**
 * Builds a TMDb client bound to an access token. The returned function fetches
 * an API endpoint with authorization and JSON parsing.
 *
 * @param accessToken - The TMDb API read access token (bearer).
 * @returns A fetcher taking the API path (e.g. '/movie/123') and optional
 * query parameters (`undefined` values are skipped) plus the error message to
 * throw on a non-OK response.
 *
 * @throws {TmdbRequestError} From the returned fetcher when the response
 * status is not OK.
 */
export function createTmdbFetch(accessToken: string): TmdbFetch {
  return async function tmdbFetch<T>(
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
        authorization: `Bearer ${accessToken}`,
        accept: 'application/json',
      },
    });

    if (!res.ok) {
      throw new TmdbRequestError(
        errorMessage ?? `TMDb request failed: ${path} (${res.status})`,
        res.status,
      );
    }

    return (await res.json()) as T;
  };
}
