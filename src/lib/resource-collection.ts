import 'server-only';
import { and, count, desc, eq } from 'drizzle-orm';

import type { ResourceCollectionTable } from '@/db/schema/resource-collection';
import { getUser } from '@/lib/auth-server';
import { db } from '@/lib/db';
import { buildProxyImageUrls } from '@/lib/imgproxy-url';
import { getMovieDetails } from '@/lib/movies';
import { pageSchema, resourceTypeSchema } from '@/lib/validations';
import { MovieDetails } from '@/types/movie';
import type { ProxyImageUrls } from '@/types/proxy-image';
import { TvDetails } from '@/types/tv-show';

import { ITEMS_PER_PAGE } from './config';
import { getTvShowDetails } from './tv-shows';

type ResourceDetailsWithImage = (MovieDetails | TvDetails) & {
  posterImageUrls?: ProxyImageUrls;
};

export type CollectionPage = {
  items: Array<
    ResourceCollectionTable['$inferSelect'] & {
      resource: ResourceDetailsWithImage;
    }
  >;
  totalItems: number;
  totalPages: number;
  currentPage: number;
  itemsPerPage: number;
};

function rowFilter(
  table: ResourceCollectionTable,
  userId: string,
  resourceId: number,
  resourceType: string,
) {
  return and(
    eq(table.userId, userId),
    eq(table.resourceId, resourceId),
    eq(table.resourceType, resourceType),
  );
}

/**
 * Toggles a resource's presence in a per-user collection table in a single
 * round-trip: delete returns the removed row(s); an empty result means the
 * item was absent, so it is inserted instead.
 *
 * @returns `'removed'`, `'added'`, or `'unchanged'` (a concurrent request won
 * an insert race; onConflictDoNothing made ours a no-op — trust the returned
 * rows, not the attempt, so callers don't show a false "added").
 */
export async function toggleCollectionRow(
  table: ResourceCollectionTable,
  userId: string,
  resourceId: number,
  resourceType: string,
) {
  const removed = await db
    .delete(table)
    .where(rowFilter(table, userId, resourceId, resourceType))
    .returning({ id: table.id });

  if (removed.length > 0) {
    return 'removed';
  }

  const inserted = await db
    .insert(table)
    .values({ id: crypto.randomUUID(), userId, resourceId, resourceType })
    .onConflictDoNothing()
    .returning({ id: table.id });

  return inserted.length > 0 ? 'added' : 'unchanged';
}

/**
 * Checks whether a resource exists in a per-user collection table.
 */
export async function hasCollectionRow(
  table: ResourceCollectionTable,
  userId: string,
  resourceId: number,
  resourceType: string,
) {
  const result = await db
    .select()
    .from(table)
    .where(rowFilter(table, userId, resourceId, resourceType));

  return result.length > 0;
}

/**
 * Counts a user's rows of a given resource type in a collection table.
 */
export async function countCollectionRows(
  table: ResourceCollectionTable,
  userId: string,
  resourceType: string,
) {
  const result = await db
    .select({ count: count() })
    .from(table)
    .where(and(eq(table.userId, userId), eq(table.resourceType, resourceType)));

  return result[0]?.count || 0;
}

export function emptyCollectionPage(page: number): CollectionPage {
  return {
    items: [],
    totalItems: 0,
    totalPages: 0,
    currentPage: page,
    itemsPerPage: ITEMS_PER_PAGE,
  };
}

async function fetchResourceDetails(
  resourceType: 'movie' | 'tv',
  resourceId: number,
): Promise<ResourceDetailsWithImage> {
  const details =
    resourceType === 'movie'
      ? await getMovieDetails(resourceId)
      : await getTvShowDetails(resourceId);

  return {
    ...details,
    posterImageUrls: buildProxyImageUrls(details.poster_path, {
      width: 500,
      fill: true,
    }),
  };
}

function validateCollectionPageArgs(resourceType: string, page: number) {
  if (!resourceTypeSchema.safeParse(resourceType).success || !pageSchema.safeParse(page).success) {
    throw new Error('Invalid resource type or page number');
  }
}

/**
 * Validated, authenticated entry point for a collection page: throws on bad
 * input or a missing user, and degrades to an empty page when the query or
 * TMDB lookups fail.
 */
export async function getAuthedCollectionPage(
  table: ResourceCollectionTable,
  resourceType: 'movie' | 'tv',
  page: number,
  errorLabel: string,
) {
  validateCollectionPageArgs(resourceType, page);

  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  try {
    return await getCollectionPageWithDetails(table, user.id, resourceType, page);
  } catch (error) {
    console.error(`Error fetching paginated ${errorLabel}:`, error);
    return emptyCollectionPage(page);
  }
}

/**
 * Retrieves one page of a user's collection rows of a given resource type,
 * newest first, each augmented with TMDB details. Rows whose detail fetch
 * fails are dropped from the page rather than failing the whole request.
 */
export async function getCollectionPageWithDetails(
  table: ResourceCollectionTable,
  userId: string,
  resourceType: 'movie' | 'tv',
  page: number,
): Promise<CollectionPage> {
  const totalItems = await countCollectionRows(table, userId, resourceType);
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  if (totalItems === 0) {
    return emptyCollectionPage(page);
  }

  const rows = await db
    .select()
    .from(table)
    .where(and(eq(table.userId, userId), eq(table.resourceType, resourceType)))
    .orderBy(desc(table.createdAt))
    .limit(ITEMS_PER_PAGE)
    .offset((page - 1) * ITEMS_PER_PAGE);

  const rowsWithDetails = await Promise.allSettled(
    rows.map(async (row) => ({
      ...row,
      resource: await fetchResourceDetails(resourceType, row.resourceId),
    })),
  );

  const items = rowsWithDetails
    .filter((result) => result.status === 'fulfilled')
    .map((result) => result.value);

  return {
    items,
    totalItems,
    totalPages,
    currentPage: page,
    itemsPerPage: ITEMS_PER_PAGE,
  };
}
