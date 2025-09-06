import { RegionCode } from '@/lib/regions';
import { Genre } from './genre';
import { RegionWatchProviders } from './watch-provider';

export type TvDetails = {
  id: number;
  name: string;
  original_name: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  vote_average: number;
  vote_count: number;
  first_air_date: string;
  last_air_date: string;
  genres: Genre[];
  homepage: string;
  status: string;
  tagline: string;
  popularity: number;
  number_of_episodes: number;
  number_of_seasons: number;
  episode_run_time: number[];
  spoken_languages: {
    english_name: string;
    iso_639_1: string;
    name: string;
  }[];
  networks: {
    id: number;
    name: string;
    logo_path: string;
    origin_country: string;
  }[];
  created_by: {
    id: number;
    name: string;
    profile_path: string;
    credit_id: string;
  }[];
};

export type TvCredits = {
  id: number;
  cast: Cast[];
  crew: Crew[];
};

export type Cast = {
  id: number;
  name: string;
  character: string;
  profile_path: string;
  credit_id: string;
};

export type Crew = {
  id: number;
  name: string;
};

export type TvWatchProviders = {
  results: {
    [region in RegionCode]: RegionWatchProviders;
  };
};

export type TvShow = {
  id: number;
  name: string;
  original_name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string;
  vote_average: number;
  vote_count: number;
  first_air_date: string;
  genre_ids: number[];
  popularity: number;
  media_type: string;
  origin_country: string[];
  original_language: string;
};

export type TvResponse = {
  page: number;
  results: TvShow[];
  total_pages: number;
  total_results: number;
};

export type SearchedTvResponse = {
  page: number;
  results: TvShow[];
  total_pages: number;
  total_results: number;
};

export type TvRecommendations = {
  page: number;
  results: TvShow[];
  total_pages: number;
  total_results: number;
};

export type TvSimilar = {
  page: number;
  results: TvShow[];
  total_pages: number;
  total_results: number;
};

export type TmdbExternalIdsResponse = {
  imdb_id: string;
};
