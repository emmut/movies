import type { MovieReleaseDatesResponse } from './certification';
import type { TmdbVideoResponse } from './tmdb-video';

export type ProductionCompany = { id: number; name: string; logo_path: string | null };
export type SeasonSummary = {
  id: number;
  name: string;
  season_number: number;
  episode_count: number;
  poster_path: string | null;
  air_date: string | null;
};
export type Episode = {
  id: number;
  name: string;
  episode_number: number;
  season_number: number;
  air_date: string | null;
  overview: string;
  still_path: string | null;
  runtime: number | null;
  vote_average: number;
  vote_count: number;
};
export type SeasonDetails = { name: string; episodes: Episode[] };
export type CollectionDetails = {
  name: string;
  parts: { id: number; title: string; poster_path: string | null; release_date: string }[];
};
export type PdpExtras = {
  images?: { backdrops: { file_path: string }[]; posters: { file_path: string }[] };
  keywords?: {
    keywords?: { id: number; name: string }[];
    results?: { id: number; name: string }[];
  };
  videos?: TmdbVideoResponse;
  release_dates?: MovieReleaseDatesResponse;
};
export type AggregateCredits = {
  cast: {
    id: number;
    name: string;
    total_episode_count: number;
    roles: { character: string; episode_count: number }[];
  }[];
};
