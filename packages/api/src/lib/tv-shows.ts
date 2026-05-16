import { buildProxyImageUrls } from "@movies/media/imgproxy-url";

import { MAJOR_STREAMING_PROVIDERS } from "./config";
import { MIN_RUNTIME_FILTER_MINUTES } from "./constants";
import { DEFAULT_REGION } from "./regions";
import { tmdbFetch } from "./tmdb";
import type { GenreResponse } from "../types/genre";
import type { TmdbVideoResponse } from "../types/tmdb-video";
import type {
  TmdbExternalIdsResponse,
  TvCredits,
  TvDetails,
  TvRecommendations,
  TvResponse,
  TvSimilar,
  TvWatchProviders,
} from "../types/tv-show";

const majorProviders = MAJOR_STREAMING_PROVIDERS.join("|");

function addPosterImageUrls<T extends { poster_path: string | null }>(item: T) {
  if (!item.poster_path) return item;
  return {
    ...item,
    posterImageUrls: buildProxyImageUrls(item.poster_path, { width: 500, fill: true }),
  };
}

export async function getTvShowDetails(tvId: number) {
  return await tmdbFetch<TvDetails>(`/tv/${tvId}`);
}

export async function getTvShowCredits(tvId: number) {
  return await tmdbFetch<TvCredits>(`/tv/${tvId}/credits`);
}

export async function getTvShowWatchProviders(tvId: number) {
  const data = await tmdbFetch<TvWatchProviders>(`/tv/${tvId}/watch/providers`);
  return { results: data.results };
}

export async function fetchDiscoverTvShows(
  genreId: number,
  page: number = 1,
  sortBy?: string,
  watchProviders?: string,
  watchRegion?: string,
  withRuntimeLte?: number,
) {
  const params: Record<string, string | number | undefined> = {
    page,
    sort_by: sortBy || "popularity.desc",
    region: watchRegion || DEFAULT_REGION,
    include_adult: "false",
  };
  if (genreId !== 0) params.with_genres = genreId;
  params.with_watch_providers = watchProviders || majorProviders;
  params.watch_region = watchRegion || DEFAULT_REGION;
  if (typeof withRuntimeLte === "number" && withRuntimeLte > 0) {
    params["with_runtime.lte"] = withRuntimeLte;
    params["with_runtime.gte"] = MIN_RUNTIME_FILTER_MINUTES;
  }

  const data = await tmdbFetch<TvResponse>("/discover/tv", params);
  const totalPages = data.total_pages >= 500 ? 500 : data.total_pages;
  return { tvShows: data.results.map(addPosterImageUrls), totalPages };
}

export async function fetchTrendingTvShows() {
  const data = await tmdbFetch<TvResponse>("/trending/tv/day");
  return data.results;
}

export async function fetchTopRatedTvShows(region: string = DEFAULT_REGION) {
  const data = await tmdbFetch<TvResponse>("/tv/top_rated", { region });
  return data.results;
}

export async function fetchOnTheAirTvShows(region: string = DEFAULT_REGION) {
  const data = await tmdbFetch<TvResponse>("/tv/on_the_air", { region });
  return data.results;
}

export async function fetchPopularTvShows(region: string = DEFAULT_REGION) {
  const data = await tmdbFetch<TvResponse>("/tv/popular", { region });
  return data.results;
}

export async function fetchAvailableTvGenres() {
  const data = await tmdbFetch<GenreResponse>("/genre/tv/list");
  return data.genres;
}

export async function getTvShowTrailer(tvId: number) {
  try {
    const data = await tmdbFetch<TmdbVideoResponse>(`/tv/${tvId}/videos`);
    const trailer = data.results.find(
      (v) => (v.type === "Trailer" || v.type === "Teaser") && v.site === "YouTube",
    );
    return trailer?.key ?? null;
  } catch (error) {
    console.error("Error fetching trailer:", error);
    return null;
  }
}

export async function getTvShowSimilar(tvId: number, region?: string) {
  const data = await tmdbFetch<TvSimilar>(
    `/tv/${tvId}/similar`,
    region ? { region } : undefined,
  );
  return data.results;
}

export async function getTvShowRecommendations(tvId: number, region?: string) {
  const data = await tmdbFetch<TvRecommendations>(
    `/tv/${tvId}/recommendations`,
    region ? { region } : undefined,
  );
  return data.results;
}

export async function getTvShowImdbId(tvId: number) {
  const data = await tmdbFetch<TmdbExternalIdsResponse>(`/tv/${tvId}/external_ids`);
  return data.imdb_id;
}
