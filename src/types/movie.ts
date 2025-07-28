import { RegionCode } from '@/lib/regions';
import { Genre } from './genre';
import { WatchProvider } from './watch-provider';

export type Movie = {
  adult: boolean;
  backdrop_path: string;
  id: number;
  title: string;
  original_language: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  media_type: string;
  genre_ids: number[];
  popularity: number;
  release_date: string;
  video: boolean;
  vote_average: number;
  vote_count: number;
  trailer_key?: string;
};

export type MovieDetails = {
  adult: boolean;
  backdrop_path: string;
  budget: number;
  genres: Genre[];
  homepage: string;
  id: number;
  imdb_id: string;
  original_language: string;
  original_title: string;
  overview: string;
  popularity: number;
  poster_path: string;
  release_date: string;
  revenue: number;
  runtime: number;
  spoken_languages: {
    english_name: string;
    iso_639_1: string;
    name: string;
  }[];
  status: string;
  tagline: string;
  title: string;
  video: boolean;
  vote_average: number;
  vote_count: number;
};

export type MovieResponse = {
  page: number;
  results: Movie[];
  total_pages: number;
  total_results: number;
  dates:
    | {
        maximum: string;
        minimum: string;
      }
    | undefined;
};

export type CastMember = {
  adult: boolean;
  gender: number;
  id: number;
  known_for_department: string;
  name: string;
  original_name: string;
  popularity: number;
  profile_path: string | null;
  cast_id: number;
  character: string;
  credit_id: string;
  order: number;
};

export type CrewMember = {
  adult: boolean;
  gender: number;
  id: number;
  known_for_department: string;
  name: string;
  original_name: string;
  popularity: number;
  profile_path: string | null;
  credit_id: string;
  department: string;
  job: string;
};

export type MovieCredits = {
  id: number;
  cast: CastMember[];
  crew: CrewMember[];
};

export type RegionWatchProviders = {
  link: string;
  rent?: WatchProvider[];
  buy?: WatchProvider[];
  flatrate?: WatchProvider[];
};

export type MovieWatchProviders = {
  id: number;
  results: {
    [region in RegionCode]: RegionWatchProviders;
  };
};

export type SearchedMovieResponse = {
  page: number;
  results: Movie[];
  total_pages: number;
  total_results: number;
};

export type MovieRecommendations = {
  page: number;
  results: Movie[];
  total_pages: number;
  total_results: number;
};

export type MovieSimilar = {
  page: number;
  results: Movie[];
  total_pages: number;
  total_results: number;
};
