export type TmdbVideo = {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
  published_at: string;
  size: number;
  iso_639_1: string;
  iso_3166_1: string;
};

export type TmdbVideoResponse = {
  id: number;
  results: TmdbVideo[];
};
