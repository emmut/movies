export type TvDetails = {
  id: number;
  name: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  vote_average: number;
  vote_count: number;
  first_air_date: string;
  last_air_date: string;
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
};

export type Crew = {
  id: number;
  name: string;
};
