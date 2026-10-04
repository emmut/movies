export type MovieReleaseDatesResult = {
  iso_3166_1: string;
  release_dates: {
    certification: string;
    iso_639_1: string;
    release_date: string;
    type: number;
  }[];
};

export type MovieReleaseDatesResponse = {
  id: number;
  results: MovieReleaseDatesResult[];
};

export type TvContentRatingsResult = {
  iso_3166_1: string;
  rating: string;
};

export type TvContentRatingsResponse = {
  id: number;
  results: TvContentRatingsResult[];
};
