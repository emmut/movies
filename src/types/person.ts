export type PersonDetails = {
  id: number;
  name: string;
  biography: string;
  birthday: string | null;
  deathday: string | null;
  place_of_birth: string | null;
  profile_path: string | null;
  popularity: number;
  known_for_department: string;
  also_known_as: string[];
  homepage: string | null;
  imdb_id: string | null;
};

export type PersonMovieCredit = {
  id: number;
  title: string;
  original_title: string;
  release_date: string;
  poster_path: string | null;
  character: string;
  credit_id: string;
  vote_average: number;
  popularity: number;
};

export type PersonCrewCredit = {
  id: number;
  title: string;
  original_title: string;
  release_date: string;
  poster_path: string | null;
  job: string;
  department: string;
  credit_id: string;
  vote_average: number;
  popularity: number;
};

export type PersonTvCredit = {
  id: number;
  name: string;
  original_name: string;
  first_air_date: string;
  poster_path: string | null;
  character: string;
  credit_id: string;
  vote_average: number;
  popularity: number;
  episode_count: number;
};

export type PersonTvCredits = {
  cast: PersonTvCredit[];
  crew: PersonCrewCredit[];
  id: number;
};

export type PersonMovieCredits = {
  cast: PersonMovieCredit[];
  crew: PersonCrewCredit[];
  id: number;
};

export type SearchedPerson = {
  id: number;
  name: string;
  profile_path: string | null;
  popularity: number;
  known_for_department: string;
  known_for: Array<{
    id: number;
    title?: string;
    name?: string;
    media_type: 'movie' | 'tv';
  }>;
};

export type SearchedPersonResponse = {
  page: number;
  results: SearchedPerson[];
  total_pages: number;
  total_results: number;
};
