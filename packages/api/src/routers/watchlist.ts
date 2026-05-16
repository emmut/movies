import { z } from "zod";

import { protectedProcedure, publicProcedure } from "../index";
import {
  addToWatchlist,
  getUserWatchlist,
  getWatchlistCount,
  getWatchlistWithResourceDetailsPaginated,
  isResourceInWatchlist,
  removeFromWatchlist,
  toggleWatchlist,
} from "../lib/watchlist";

const resourceInput = z.object({
  resourceId: z.number().int().positive(),
  resourceType: z.enum(["movie", "tv"]),
});

export const watchlistRouter = {
  list: protectedProcedure.handler(({ context }) => getUserWatchlist(context.session.user.id)),
  paginated: protectedProcedure
    .input(z.object({ resourceType: z.enum(["movie", "tv"]), page: z.number().int().min(1).default(1) }))
    .handler(({ context, input }) =>
      getWatchlistWithResourceDetailsPaginated(context.session.user.id, input.resourceType, input.page),
    ),
  count: publicProcedure
    .input(z.object({ resourceType: z.string() }))
    .handler(({ context, input }) => getWatchlistCount(context.session?.user?.id, input.resourceType)),
  status: publicProcedure
    .input(z.object({ resourceId: z.number().int().positive(), resourceType: z.string() }))
    .handler(({ context, input }) =>
      isResourceInWatchlist(context.session?.user?.id, input.resourceId, input.resourceType),
    ),
  add: protectedProcedure
    .input(resourceInput)
    .handler(({ context, input }) =>
      addToWatchlist(context.session.user.id, input.resourceId, input.resourceType),
    ),
  remove: protectedProcedure
    .input(resourceInput)
    .handler(({ context, input }) =>
      removeFromWatchlist(context.session.user.id, input.resourceId, input.resourceType),
    ),
  toggle: protectedProcedure
    .input(resourceInput)
    .handler(({ context, input }) =>
      toggleWatchlist(context.session.user.id, input.resourceId, input.resourceType),
    ),
};
