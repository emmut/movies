import { z } from "zod";

import { publicProcedure } from "../index";
import {
  getSearchMovies,
  getSearchMulti,
  getSearchPersons,
  getSearchTvShows,
} from "../lib/search";

const searchInput = z.object({
  query: z.string().min(1),
  page: z.number().int().min(1).default(1),
});

export const searchRouter = {
  movies: publicProcedure.input(searchInput).handler(({ input }) => getSearchMovies(input.query, input.page)),
  tv: publicProcedure.input(searchInput).handler(({ input }) => getSearchTvShows(input.query, input.page)),
  persons: publicProcedure.input(searchInput).handler(({ input }) => getSearchPersons(input.query, input.page)),
  multi: publicProcedure.input(searchInput).handler(({ input }) => getSearchMulti(input.query, input.page)),
};
