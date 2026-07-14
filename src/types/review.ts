export type TmdbReview = {
  id: string;
  author: string;
  author_details: {
    name: string;
    username: string;
    avatar_path: string | null;
    rating: number | null;
  };
  content: string;
  created_at: string;
  updated_at: string;
  url: string;
};

export type TmdbReviewsResponse = {
  id: number;
  page: number;
  results: TmdbReview[];
  total_pages: number;
  total_results: number;
};
