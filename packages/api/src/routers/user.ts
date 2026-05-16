import { z } from "zod";

import { protectedProcedure, publicProcedure } from "../index";
import {
  getAllWatchProviders,
  getUserRegion,
  getUserWatchProviders,
  getWatchProviders,
  setUserWatchProviders,
  updateUserRegion,
} from "../lib/user-actions";

export const userRouter = {
  region: publicProcedure.handler(({ context }) => getUserRegion(context.session?.user?.id)),
  updateRegion: protectedProcedure
    .input(z.object({ region: z.string().min(1) }))
    .handler(({ context, input }) => updateUserRegion(context.session.user.id, input.region)),
  watchProviders: publicProcedure
    .input(
      z.object({
        region: z.string().optional(),
        userProviders: z.array(z.number()).optional(),
      }),
    )
    .handler(({ input }) => getWatchProviders(input.region, input.userProviders)),
  allWatchProviders: publicProcedure
    .input(z.object({ region: z.string().optional() }))
    .handler(({ input }) => getAllWatchProviders(input.region)),
  userWatchProviders: publicProcedure.handler(({ context }) =>
    getUserWatchProviders(context.session?.user?.id),
  ),
  setUserWatchProviders: protectedProcedure
    .input(z.object({ providerIds: z.array(z.number().int()) }))
    .handler(({ context, input }) =>
      setUserWatchProviders(context.session.user.id, input.providerIds),
    ),
};
