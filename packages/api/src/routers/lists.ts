import { z } from "zod";

import { protectedProcedure } from "../index";
import {
  addToList,
  createList,
  deleteList,
  getListDetailsPaginated,
  getListDetailsWithResources,
  getUserListCount,
  getUserLists,
  getUserListsPaginated,
  getUserListsWithStatus,
  removeFromList,
  updateList,
} from "../lib/lists";

const mediaInput = z.object({
  listId: z.string(),
  mediaId: z.number().int().positive(),
  mediaType: z.enum(["movie", "tv", "person"]),
});

export const listsRouter = {
  all: protectedProcedure.handler(({ context }) => getUserLists(context.session.user.id)),
  count: protectedProcedure.handler(({ context }) => getUserListCount(context.session.user.id)),
  paginated: protectedProcedure
    .input(z.object({ page: z.number().int().min(1).default(1) }))
    .handler(({ context, input }) => getUserListsPaginated(context.session.user.id, input.page)),
  detail: protectedProcedure
    .input(z.object({ listId: z.string(), page: z.number().int().min(1).default(1) }))
    .handler(({ context, input }) =>
      getListDetailsPaginated(context.session.user.id, input.listId, input.page),
    ),
  detailWithResources: protectedProcedure
    .input(z.object({ listId: z.string(), page: z.number().int().min(1).default(1) }))
    .handler(({ context, input }) =>
      getListDetailsWithResources(context.session.user.id, input.listId, input.page),
    ),
  withStatus: protectedProcedure
    .input(
      z.object({
        mediaId: z.number().int().positive(),
        mediaType: z.enum(["movie", "tv", "person"]),
      }),
    )
    .handler(({ context, input }) =>
      getUserListsWithStatus(context.session.user.id, input.mediaId, input.mediaType),
    ),
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        emoji: z.string().optional(),
      }),
    )
    .handler(({ context, input }) =>
      createList(context.session.user.id, input.name, input.description, input.emoji),
    ),
  update: protectedProcedure
    .input(
      z.object({
        listId: z.string(),
        name: z.string().min(1),
        description: z.string().optional(),
        emoji: z.string().optional(),
      }),
    )
    .handler(({ context, input }) =>
      updateList(context.session.user.id, input.listId, input.name, input.description, input.emoji),
    ),
  delete: protectedProcedure
    .input(z.object({ listId: z.string() }))
    .handler(({ context, input }) => deleteList(context.session.user.id, input.listId)),
  addItem: protectedProcedure
    .input(mediaInput)
    .handler(({ context, input }) =>
      addToList(context.session.user.id, input.listId, input.mediaId, input.mediaType),
    ),
  removeItem: protectedProcedure
    .input(mediaInput)
    .handler(({ context, input }) =>
      removeFromList(context.session.user.id, input.listId, input.mediaId, input.mediaType),
    ),
};
