import { os, type RouterClient } from '@orpc/server';
import { z } from 'zod';

import { homeListInput, trendingInput, mediaCardSchema, type MediaCard } from './home';

// Services are supplied by the host, so the router has no app, env, or database dependencies.
export type HomeService = {
  list(input: z.infer<typeof homeListInput>): Promise<MediaCard[]>;
  trending(input: z.infer<typeof trendingInput>): Promise<MediaCard[]>;
};
const procedure = os.$context<{ home: HomeService }>();
export const appRouter = {
  home: {
    list: procedure
      .input(homeListInput)
      .output(z.array(mediaCardSchema))
      .handler(({ input, context }) => context.home.list(input)),
    trending: procedure
      .input(trendingInput)
      .output(z.array(mediaCardSchema))
      .handler(({ input, context }) => context.home.trending(input)),
  },
};
export type AppRouterClient = RouterClient<typeof appRouter>;
