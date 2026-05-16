import { db } from "@movies/db";
import { listItems, lists } from "@movies/db/schema/lists";
import { buildProxyImageUrls } from "@movies/media/imgproxy-url";
import { and, count, desc, eq, sql } from "drizzle-orm";

import { ITEMS_PER_PAGE } from "./config";
import { getMovieDetails } from "./movies";
import { getPersonDetails } from "./persons";
import { getTvShowDetails } from "./tv-shows";
import {
  createListSchema,
  listIdSchema,
  listItemSchema,
  mediaIdSchema,
  mediaTypeSchema,
  pageSchema,
  removeListItemSchema,
  updateListSchema,
} from "./validations";

export async function getUserLists(userId: string) {
  const userLists = await db
    .select({
      id: lists.id,
      name: lists.name,
      description: lists.description,
      emoji: lists.emoji,
      createdAt: lists.createdAt,
      updatedAt: lists.updatedAt,
    })
    .from(lists)
    .where(eq(lists.userId, userId))
    .orderBy(desc(lists.updatedAt));

  return await Promise.all(
    userLists.map(async (list) => {
      const result = await db
        .select({ count: sql`count(*)`.mapWith(Number) })
        .from(listItems)
        .where(eq(listItems.listId, list.id));
      return { ...list, itemCount: result[0].count };
    }),
  );
}

export async function getUserListCount(userId: string) {
  try {
    const result = await db
      .select({ count: sql`count(*)`.mapWith(Number) })
      .from(lists)
      .where(eq(lists.userId, userId));
    return result[0].count;
  } catch (error) {
    console.error("Error fetching user list count:", error);
    return 0;
  }
}

export async function getUserListsPaginated(userId: string, page: number = 1) {
  if (!pageSchema.safeParse(page).success) throw new Error("Invalid page");

  const totalCountResult = await db
    .select({ count: count() })
    .from(lists)
    .where(eq(lists.userId, userId));

  const totalItems = totalCountResult[0]?.count ?? 0;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const currentPage = Math.max(1, Math.min(page, totalPages || 1));

  if (totalItems === 0) {
    return { lists: [], totalItems: 0, totalPages: 0, currentPage, itemsPerPage: ITEMS_PER_PAGE };
  }

  const offset = Math.max(0, (currentPage - 1) * ITEMS_PER_PAGE);
  const paginatedLists = await db
    .select({
      id: lists.id,
      name: lists.name,
      description: lists.description,
      emoji: lists.emoji,
      createdAt: lists.createdAt,
      updatedAt: lists.updatedAt,
    })
    .from(lists)
    .where(eq(lists.userId, userId))
    .orderBy(desc(lists.updatedAt))
    .limit(ITEMS_PER_PAGE)
    .offset(offset);

  const withCounts = await Promise.all(
    paginatedLists.map(async (list) => {
      const result = await db
        .select({ count: sql`count(*)`.mapWith(Number) })
        .from(listItems)
        .where(eq(listItems.listId, list.id));
      return { ...list, itemCount: result[0].count };
    }),
  );

  return {
    lists: withCounts,
    totalItems,
    totalPages,
    currentPage,
    itemsPerPage: ITEMS_PER_PAGE,
  };
}

export async function getListDetailsPaginated(userId: string, listId: string, page: number = 1) {
  if (!listIdSchema.safeParse(listId).success) throw new Error("Invalid list ID");
  if (!pageSchema.safeParse(page).success) throw new Error("Invalid page");

  const listResult = await db
    .select()
    .from(lists)
    .where(and(eq(lists.id, listId), eq(lists.userId, userId)));

  if (listResult.length === 0) throw new Error("List not found");
  const list = listResult[0];

  const totalCountResult = await db
    .select({ count: count() })
    .from(listItems)
    .where(eq(listItems.listId, listId));

  const totalItems = Number(totalCountResult[0]?.count) || 0;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const currentPage = Math.max(1, Math.min(page, totalPages || 1));

  if (totalItems === 0) {
    return { ...list, items: [], itemCount: 0, totalItems: 0, totalPages: 0, currentPage, itemsPerPage: ITEMS_PER_PAGE };
  }

  const offset = Math.max(0, (currentPage - 1) * ITEMS_PER_PAGE);
  const items = await db
    .select()
    .from(listItems)
    .where(eq(listItems.listId, listId))
    .orderBy(desc(listItems.createdAt))
    .limit(ITEMS_PER_PAGE)
    .offset(offset);

  return { ...list, items, itemCount: totalItems, totalItems, totalPages, currentPage, itemsPerPage: ITEMS_PER_PAGE };
}

export async function getListDetailsWithResources(userId: string, listId: string, page: number = 1) {
  const paginated = await getListDetailsPaginated(userId, listId, page);

  const movieItems = paginated.items?.filter((i) => i.resourceType === "movie") || [];
  const tvItems = paginated.items?.filter((i) => i.resourceType === "tv") || [];
  const personItems = paginated.items?.filter((i) => i.resourceType === "person") || [];

  const [movies, tvShows, persons] = await Promise.all([
    Promise.allSettled(movieItems.map((i) => getMovieDetails(i.resourceId))),
    Promise.allSettled(tvItems.map((i) => getTvShowDetails(i.resourceId))),
    Promise.allSettled(personItems.map((i) => getPersonDetails(i.resourceId))),
  ]).then(([m, t, p]) => [
    m.filter((r) => r.status === "fulfilled").map((r: any) => r.value),
    t.filter((r) => r.status === "fulfilled").map((r: any) => r.value),
    p.filter((r) => r.status === "fulfilled").map((r: any) => r.value),
  ]);

  const allItems = [
    ...movies.map((m: any) => ({
      ...m,
      posterImageUrls: buildProxyImageUrls(m.poster_path, { width: 500, fill: true }),
      resourceType: "movie" as const,
    })),
    ...tvShows.map((s: any) => ({
      ...s,
      posterImageUrls: buildProxyImageUrls(s.poster_path, { width: 500, fill: true }),
      resourceType: "tv" as const,
    })),
    ...persons.map((p: any) => ({
      ...p,
      profileImageUrls: p.profile_path ? buildProxyImageUrls(p.profile_path, { width: 500, fill: true }) : undefined,
      resourceType: "person" as const,
    })),
  ];

  return { ...paginated, allItems };
}

export async function createList(userId: string, name: string, description = "", emoji = "📝") {
  const validated = createListSchema.parse({ name, description, emoji });
  const listId = crypto.randomUUID();
  await db.insert(lists).values({
    id: listId,
    userId,
    name: validated.name,
    description: validated.description,
    emoji: validated.emoji,
  });
  return { success: true, listId };
}

export async function addToList(userId: string, listId: string, mediaId: number, mediaType: "movie" | "tv" | "person") {
  if (!listIdSchema.safeParse(listId).success) throw new Error("Invalid list ID");
  if (!mediaIdSchema.safeParse(mediaId).success) throw new Error("Invalid media ID");
  if (!mediaTypeSchema.safeParse(mediaType).success) throw new Error("Invalid media type");

  const validated = listItemSchema.parse({ listId, resourceId: mediaId, resourceType: mediaType });

  const [{ count: c }] = await db
    .select({ count: sql`count(*)`.mapWith(Number) })
    .from(lists)
    .where(and(eq(lists.id, validated.listId), eq(lists.userId, userId)));
  if (c === 0) throw new Error("List not found");

  try {
    await db.insert(listItems).values({
      id: crypto.randomUUID(),
      listId: validated.listId,
      resourceId: validated.resourceId,
      resourceType: validated.resourceType,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("unique")) throw new Error("Item already in list");
    throw error;
  }
  return { success: true };
}

export async function removeFromList(userId: string, listId: string, mediaId: number, mediaType: "movie" | "tv" | "person") {
  if (!listIdSchema.safeParse(listId).success) throw new Error("Invalid list ID");
  if (!mediaIdSchema.safeParse(mediaId).success) throw new Error("Invalid media ID");
  if (!mediaTypeSchema.safeParse(mediaType).success) throw new Error("Invalid media type");

  const validated = removeListItemSchema.parse({ listId, resourceId: mediaId, resourceType: mediaType });

  const [{ count: c }] = await db
    .select({ count: sql`count(*)`.mapWith(Number) })
    .from(lists)
    .where(and(eq(lists.id, validated.listId), eq(lists.userId, userId)));
  if (c === 0) throw new Error("List not found");

  await db
    .delete(listItems)
    .where(
      and(
        eq(listItems.listId, validated.listId),
        eq(listItems.resourceId, validated.resourceId),
        eq(listItems.resourceType, validated.resourceType),
      ),
    );
  return { success: true };
}

export async function deleteList(userId: string, listId: string) {
  if (!listIdSchema.safeParse(listId).success) throw new Error("Invalid list ID");
  const [{ count: c }] = await db
    .select({ count: sql`count(*)`.mapWith(Number) })
    .from(lists)
    .where(and(eq(lists.id, listId), eq(lists.userId, userId)));
  if (c === 0) throw new Error("List not found");
  await db.delete(lists).where(eq(lists.id, listId));
  return { success: true };
}

export async function updateList(userId: string, listId: string, name: string, description = "", emoji = "📝") {
  if (!listIdSchema.safeParse(listId).success) throw new Error("Invalid list ID");
  const validated = updateListSchema.parse({ listId, name, description, emoji });
  const [{ count: c }] = await db
    .select({ count: sql`count(*)`.mapWith(Number) })
    .from(lists)
    .where(and(eq(lists.id, validated.listId), eq(lists.userId, userId)));
  if (c === 0) throw new Error("List not found");

  await db
    .update(lists)
    .set({
      name: validated.name,
      description: validated.description,
      emoji: validated.emoji,
      updatedAt: new Date(),
    })
    .where(eq(lists.id, validated.listId));
  return { success: true };
}

export async function getUserListsWithStatus(userId: string, mediaId: number, mediaType: "movie" | "tv" | "person") {
  if (!mediaIdSchema.safeParse(mediaId).success) throw new Error("Invalid media ID");
  if (!mediaTypeSchema.safeParse(mediaType).success) throw new Error("Invalid media type");

  return await db
    .select({
      id: lists.id,
      name: lists.name,
      description: lists.description,
      emoji: lists.emoji,
      createdAt: lists.createdAt,
      updatedAt: lists.updatedAt,
      itemCount: sql<number>`count(${listItems.id})`.mapWith(Number),
      hasItem: sql<boolean>`bool_or(
        ${listItems.resourceId} = ${mediaId} AND
        ${listItems.resourceType} = ${mediaType}
      )`.mapWith(Boolean),
    })
    .from(lists)
    .leftJoin(listItems, eq(lists.id, listItems.listId))
    .where(eq(lists.userId, userId))
    .groupBy(lists.id, lists.name, lists.description, lists.emoji, lists.createdAt, lists.updatedAt)
    .orderBy(desc(lists.updatedAt));
}
