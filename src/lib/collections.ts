'use server';

import { and, count, desc, eq } from 'drizzle-orm';
import { cacheLife, cacheTag } from 'next/cache';

import { userCollections } from '@/db/schema/user-collections';
import { getUser } from '@/lib/auth-server';
import { CACHE_TAGS } from '@/lib/cache-tags';
import { CollectionKind } from '@/lib/collections-config';
import { ITEMS_PER_PAGE } from '@/lib/config';
import { db } from '@/lib/db';
import { buildProxyImageUrls } from '@/lib/imgproxy-url';
import { getMovieDetails } from '@/lib/movies';
import { getTvShowDetails } from '@/lib/tv-shows';
import { collectionQuerySchema, resourceIdSchema } from '@/lib/validations';
import { MovieDetails } from '@/types/movie';
import type { ProxyImageUrls } from '@/types/proxy-image';
import { TvDetails } from '@/types/tv-show';

type ResourceDetails = (MovieDetails | TvDetails) & {
  posterImageUrls?: ProxyImageUrls;
};

export type CollectionPage = {
  items: Array<typeof userCollections.$inferSelect & { resource: ResourceDetails }>;
  totalItems: number;
  totalPages: number;
  currentPage: number;
  itemsPerPage: number;
};

/**
 * Checks if a resource is in one of the authenticated user's collections.
 * Resolves to `false` for anonymous visitors and on lookup failure.
 */
export async function isInCollection(
  collection: CollectionKind,
  resourceId: number,
  resourceType: string,
) {
  const user = await getUser();
  if (!user) {
    return false;
  }

  return await getCachedMembership(user.id, collection, resourceId, resourceType);
}

async function getCachedMembership(
  userId: string,
  collection: CollectionKind,
  resourceId: number,
  resourceType: string,
) {
  'use cache: private';
  cacheTag(CACHE_TAGS.private.collectionItem(userId, collection, resourceType, resourceId));
  cacheTag(CACHE_TAGS.private.collectionList(userId, collection, resourceType));
  cacheLife('privateShort');

  try {
    const validated = resourceIdSchema.parse({ resourceId, resourceType });

    const rows = await db
      .select({ id: userCollections.id })
      .from(userCollections)
      .where(
        and(
          eq(userCollections.userId, userId),
          eq(userCollections.collection, collection),
          eq(userCollections.resourceType, validated.resourceType),
          eq(userCollections.resourceId, validated.resourceId),
        ),
      );

    return rows.length > 0;
  } catch (error) {
    console.error(`Error checking ${collection} membership:`, error);
    return false;
  }
}

/**
 * Retrieves one page of a user's collection, newest first, each row augmented
 * with TMDB details and proxied poster urls. Rows whose detail fetch fails are
 * dropped from the page rather than failing the whole request; a failed query
 * degrades to an empty page.
 */
export async function getCollectionPage(
  collection: CollectionKind,
  resourceType: 'movie' | 'tv',
  page: number = 1,
): Promise<CollectionPage> {
  const validated = collectionQuerySchema.parse({ collection, resourceType, page });

  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  try {
    return await queryCollectionPage(user.id, validated.collection, validated.resourceType, validated.page);
  } catch (error) {
    console.error(`Error fetching ${collection} page:`, error);
    return emptyCollectionPage(page);
  }
}

/**
 * Gets the number of resources of one type in a user's collection.
 * Resolves to `0` for anonymous visitors and on lookup failure.
 */
export async function getCollectionCount(collection: CollectionKind, resourceType: string) {
  const user = await getUser();
  if (!user) {
    return 0;
  }

  return await getCachedCount(user.id, collection, resourceType);
}

async function getCachedCount(userId: string, collection: CollectionKind, resourceType: string) {
  'use cache: private';
  cacheTag(CACHE_TAGS.private.collectionCount(userId, collection, resourceType));
  cacheTag(CACHE_TAGS.private.collectionList(userId, collection, resourceType));
  cacheLife('privateShort');

  try {
    return await countRows(userId, collection, resourceType);
  } catch (error) {
    console.error(`Error counting ${collection} items:`, error);
    return 0;
  }
}

async function countRows(userId: string, collection: CollectionKind, resourceType: string) {
  const rows = await db
    .select({ count: count() })
    .from(userCollections)
    .where(
      and(
        eq(userCollections.userId, userId),
        eq(userCollections.collection, collection),
        eq(userCollections.resourceType, resourceType),
      ),
    );

  return rows[0]?.count || 0;
}

function emptyCollectionPage(page: number): CollectionPage {
  return {
    items: [],
    totalItems: 0,
    totalPages: 0,
    currentPage: page,
    itemsPerPage: ITEMS_PER_PAGE,
  };
}

async function queryCollectionPage(
  userId: string,
  collection: CollectionKind,
  resourceType: 'movie' | 'tv',
  page: number,
): Promise<CollectionPage> {
  const totalItems = await countRows(userId, collection, resourceType);

  if (totalItems === 0) {
    return emptyCollectionPage(page);
  }

  const rows = await db
    .select()
    .from(userCollections)
    .where(
      and(
        eq(userCollections.userId, userId),
        eq(userCollections.collection, collection),
        eq(userCollections.resourceType, resourceType),
      ),
    )
    .orderBy(desc(userCollections.createdAt))
    .limit(ITEMS_PER_PAGE)
    .offset((page - 1) * ITEMS_PER_PAGE);

  const settled = await Promise.allSettled(
    rows.map(async (row) => ({
      ...row,
      resource: await fetchResourceDetails(resourceType, row.resourceId),
    })),
  );

  return {
    items: settled.filter((result) => result.status === 'fulfilled').map((result) => result.value),
    totalItems,
    totalPages: Math.ceil(totalItems / ITEMS_PER_PAGE),
    currentPage: page,
    itemsPerPage: ITEMS_PER_PAGE,
  };
}

async function fetchResourceDetails(
  resourceType: 'movie' | 'tv',
  resourceId: number,
): Promise<ResourceDetails> {
  const details =
    resourceType === 'movie'
      ? await getMovieDetails(resourceId)
      : await getTvShowDetails(resourceId);

  return {
    ...details,
    posterImageUrls: buildProxyImageUrls(details.poster_path, { width: 500, fill: true }),
  };
}
