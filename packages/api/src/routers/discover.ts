import { z } from "zod";

import { publicProcedure } from "../index";
import { getDiscoverMedia } from "../lib/discover-client";
import { validateGenreForMediaType } from "../lib/media-actions";

export const discoverRouter = {
  media: publicProcedure
    .input(
      z.object({
        mediaType: z.enum(["movie", "tv"]),
        genreId: z.number().int().default(0),
        page: z.number().int().min(1).default(1),
        sortBy: z.string().optional(),
        watchProviders: z.string().optional(),
        watchRegion: z.string().optional(),
        withRuntimeLte: z.number().int().optional(),
      }),
    )
    .handler(({ input }) =>
      getDiscoverMedia(
        input.mediaType,
        input.genreId,
        input.page,
        input.sortBy,
        input.watchProviders,
        input.watchRegion,
        input.withRuntimeLte,
      ),
    ),
  validateGenre: publicProcedure
    .input(z.object({ genreId: z.string(), mediaType: z.enum(["movie", "tv"]) }))
    .handler(({ input }) => validateGenreForMediaType(input.genreId, input.mediaType)),
};
