import { env } from "@movies/env/server";

import { TMDB_API_URL } from "./constants";

export async function tmdbFetch<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
  const url = new URL(`${TMDB_API_URL}${path}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const res = await fetch(url, {
    headers: {
      authorization: `Bearer ${env.MOVIE_DB_ACCESS_TOKEN}`,
      accept: "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`TMDB request failed: ${path} ${res.status}`);
  }

  return (await res.json()) as T;
}
