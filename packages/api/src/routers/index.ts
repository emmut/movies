import type { RouterClient } from "@orpc/server";

import { publicProcedure } from "../index";
import { discoverRouter } from "./discover";
import { listsRouter } from "./lists";
import { moviesRouter } from "./movies";
import { passkeyRouter } from "./passkey";
import { personsRouter } from "./persons";
import { searchRouter } from "./search";
import { tvRouter } from "./tv";
import { userRouter } from "./user";
import { watchlistRouter } from "./watchlist";

export const appRouter = {
  healthCheck: publicProcedure.handler(() => "OK"),
  movies: moviesRouter,
  tv: tvRouter,
  persons: personsRouter,
  search: searchRouter,
  discover: discoverRouter,
  watchlist: watchlistRouter,
  lists: listsRouter,
  user: userRouter,
  passkey: passkeyRouter,
};

export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
