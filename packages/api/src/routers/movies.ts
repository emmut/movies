import { z } from "zod";

import { publicProcedure } from "../index";
import {
  fetchAvailableGenres,
  fetchDiscoverMovies,
  fetchNowPlayingMovies,
  fetchTopRatedMovies,
  fetchTrendingMovies,
  fetchUpcomingMovies,
  getMovieCredits,
  getMovieDetails,
  getMovieRecommendations,
  getMovieSimilar,
  getMovieTrailer,
  getMovieWatchProviders,
} from "../lib/movies";

const movieIdInput = z.object({ movieId: z.number().int().positive() });
const regionInput = z.object({ region: z.string().optional() });
const movieIdRegionInput = movieIdInput.merge(regionInput);

export const moviesRouter = {
  trending: publicProcedure.handler(() => fetchTrendingMovies()),
  genres: publicProcedure.handler(() => fetchAvailableGenres()),
  nowPlaying: publicProcedure
    .input(regionInput)
    .handler(({ input }) => fetchNowPlayingMovies(input.region)),
  upcoming: publicProcedure
    .input(regionInput)
    .handler(({ input }) => fetchUpcomingMovies(input.region)),
  topRated: publicProcedure
    .input(regionInput)
    .handler(({ input }) => fetchTopRatedMovies(input.region)),
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
      fetchDiscoverMovies(
        input.genreId,
        input.page,
        input.sortBy,
        input.watchProviders,
        input.watchRegion,
        input.withRuntimeLte,
      ),
    ),
  details: publicProcedure.input(movieIdInput).handler(({ input }) => getMovieDetails(input.movieId)),
  credits: publicProcedure.input(movieIdInput).handler(({ input }) => getMovieCredits(input.movieId)),
  watchProviders: publicProcedure
    .input(movieIdInput)
    .handler(({ input }) => getMovieWatchProviders(input.movieId)),
  trailer: publicProcedure.input(movieIdInput).handler(({ input }) => getMovieTrailer(input.movieId)),
  recommendations: publicProcedure
    .input(movieIdRegionInput)
    .handler(({ input }) => getMovieRecommendations(input.movieId, input.region)),
  similar: publicProcedure
    .input(movieIdRegionInput)
    .handler(({ input }) => getMovieSimilar(input.movieId, input.region)),
};
