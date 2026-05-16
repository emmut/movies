import { buildProxyImageUrls } from "@movies/media/imgproxy-url";

import { MAJOR_STREAMING_PROVIDERS } from "./config";
import { MIN_RUNTIME_FILTER_MINUTES } from "./constants";
import { DEFAULT_REGION } from "./regions";
import { tmdbFetch } from "./tmdb";
import type { GenreResponse } from "../types/genre";
import type {
  MovieCredits,
  MovieDetails,
  MovieRecommendations,
  MovieResponse,
  MovieSimilar,
  MovieWatchProviders,
} from "../types/movie";
import type { TmdbVideoResponse } from "../types/tmdb-video";

const majorProviders = MAJOR_STREAMING_PROVIDERS.join("|");

function addPosterImageUrls<T extends { poster_path: string | null }>(item: T) {
  if (!item.poster_path) return item;
  return {
    ...item,
    posterImageUrls: buildProxyImageUrls(item.poster_path, { width: 500, fill: true }),
  };
}

export async function fetchTrendingMovies() {
  const data = await tmdbFetch<MovieResponse>("/trending/movie/day");
  return data.results;
}

export async function fetchAvailableGenres() {
  const data = await tmdbFetch<GenreResponse>("/genre/movie/list");
  return data.genres;
}

export async function fetchDiscoverMovies(
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
    include_video: "false",
  };
  if (genreId !== 0) params.with_genres = genreId;
  params.with_watch_providers = watchProviders || majorProviders;
  params.watch_region = watchRegion || DEFAULT_REGION;
  if (typeof withRuntimeLte === "number" && withRuntimeLte > 0) {
    params["with_runtime.lte"] = withRuntimeLte;
    params["with_runtime.gte"] = MIN_RUNTIME_FILTER_MINUTES;
  }

  const data = await tmdbFetch<MovieResponse>("/discover/movie", params);
  const totalPages = data.total_pages >= 500 ? 500 : data.total_pages;
  return { movies: data.results.map(addPosterImageUrls), totalPages };
}

export async function fetchNowPlayingMovies(region: string = DEFAULT_REGION) {
  const data = await tmdbFetch<MovieResponse>("/movie/now_playing", { region });
  return data.results;
}

export async function fetchUpcomingMovies(region: string = DEFAULT_REGION) {
  const [upcoming, nowPlaying] = await Promise.all([
    tmdbFetch<MovieResponse>("/movie/upcoming", { region }),
    fetchNowPlayingMovies(region),
  ]);
  const nowPlayingIds = new Set(nowPlaying.map((m) => m.id));
  return upcoming.results.filter((m) => !nowPlayingIds.has(m.id));
}

export async function fetchTopRatedMovies(region: string = DEFAULT_REGION) {
  const data = await tmdbFetch<MovieResponse>("/movie/top_rated", { region });
  return data.results;
}

export async function getMovieDetails(movieId: number) {
  return await tmdbFetch<MovieDetails>(`/movie/${movieId}`);
}

export async function getMovieCredits(movieId: number) {
  return await tmdbFetch<MovieCredits>(`/movie/${movieId}/credits`);
}

export async function getMovieWatchProviders(movieId: number) {
  const data = await tmdbFetch<MovieWatchProviders>(`/movie/${movieId}/watch/providers`);
  return { results: data.results };
}

export async function getMovieTrailer(movieId: number) {
  try {
    const data = await tmdbFetch<TmdbVideoResponse>(`/movie/${movieId}/videos`);
    const trailer = data.results.find(
      (v) => (v.type === "Trailer" || v.type === "Teaser") && v.site === "YouTube",
    );
    return trailer?.key ?? null;
  } catch (error) {
    console.error("Error fetching trailer:", error);
    return null;
  }
}

export async function getMovieRecommendations(movieId: number, region?: string) {
  const data = await tmdbFetch<MovieRecommendations>(
    `/movie/${movieId}/recommendations`,
    region ? { region } : undefined,
  );
  return data.results;
}

export async function getMovieSimilar(movieId: number, region?: string) {
  const data = await tmdbFetch<MovieSimilar>(
    `/movie/${movieId}/similar`,
    region ? { region } : undefined,
  );
  return data.results;
}
