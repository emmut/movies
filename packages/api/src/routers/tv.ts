import { z } from "zod";

import { publicProcedure } from "../index";
import {
  fetchAvailableTvGenres,
  fetchDiscoverTvShows,
  fetchOnTheAirTvShows,
  fetchPopularTvShows,
  fetchTopRatedTvShows,
  fetchTrendingTvShows,
  getTvShowCredits,
  getTvShowDetails,
  getTvShowImdbId,
  getTvShowRecommendations,
  getTvShowSimilar,
  getTvShowTrailer,
  getTvShowWatchProviders,
} from "../lib/tv-shows";

const tvIdInput = z.object({ tvId: z.number().int().positive() });
const regionInput = z.object({ region: z.string().optional() });
const tvIdRegionInput = tvIdInput.merge(regionInput);

export const tvRouter = {
  trending: publicProcedure.handler(() => fetchTrendingTvShows()),
  genres: publicProcedure.handler(() => fetchAvailableTvGenres()),
  topRated: publicProcedure.input(regionInput).handler(({ input }) => fetchTopRatedTvShows(input.region)),
  onTheAir: publicProcedure.input(regionInput).handler(({ input }) => fetchOnTheAirTvShows(input.region)),
  popular: publicProcedure.input(regionInput).handler(({ input }) => fetchPopularTvShows(input.region)),
  discover: publicProcedure
    .input(
      z.object({
        genreId: z.number().int().default(0),
        page: z.number().int().min(1).default(1),
        sortBy: z.string().optional(),
        watchProviders: z.string().optional(),
        watchRegion: z.string().optional(),
        withRuntimeLte: z.number().int().optional(),
      }),
    )
    .handler(({ input }) =>
      fetchDiscoverTvShows(
        input.genreId,
        input.page,
        input.sortBy,
        input.watchProviders,
        input.watchRegion,
        input.withRuntimeLte,
      ),
    ),
  details: publicProcedure.input(tvIdInput).handler(({ input }) => getTvShowDetails(input.tvId)),
  credits: publicProcedure.input(tvIdInput).handler(({ input }) => getTvShowCredits(input.tvId)),
  watchProviders: publicProcedure.input(tvIdInput).handler(({ input }) => getTvShowWatchProviders(input.tvId)),
  trailer: publicProcedure.input(tvIdInput).handler(({ input }) => getTvShowTrailer(input.tvId)),
  recommendations: publicProcedure
    .input(tvIdRegionInput)
    .handler(({ input }) => getTvShowRecommendations(input.tvId, input.region)),
  similar: publicProcedure
    .input(tvIdRegionInput)
    .handler(({ input }) => getTvShowSimilar(input.tvId, input.region)),
  imdbId: publicProcedure.input(tvIdInput).handler(({ input }) => getTvShowImdbId(input.tvId)),
};
