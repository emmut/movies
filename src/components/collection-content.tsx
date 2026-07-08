'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';

import ItemCard from '@/components/item-card';
import MediaTypeSelector from '@/components/media-type-selector';
import { PaginationControls } from '@/components/pagination-controls';
import { PosterSkeletonGrid } from '@/components/poster-skeleton-grid';
import SectionTitle from '@/components/section-title';
import { useScrollOnPageChange } from '@/hooks/use-scroll-on-page-change';
import { CollectionPage, getCollectionCount, getCollectionPage } from '@/lib/collections';
import {
  COLLECTION_GC_TIME,
  COLLECTION_STALE_TIME,
  CollectionKind,
} from '@/lib/collections-config';
import { queryKeys } from '@/lib/query-keys';

type MediaType = 'movie' | 'tv';

const MEDIA_META = {
  movie: { emoji: '🎬', singular: 'movie', plural: 'movies', explore: 'Movies' },
  tv: { emoji: '📺', singular: 'TV show', plural: 'TV shows', explore: 'TV Shows' },
} as const;

type CollectionCopy = {
  title: string;
  /** Follows the item count, e.g. "3 movies saved" / "3 movies watched". */
  countVerb: string;
  emptyTitle: (mediaLabel: string, isCollectionEmpty: boolean) => string;
  emptyHint: (mediaLabel: string, isCollectionEmpty: boolean) => string;
};

const COLLECTION_COPY: Record<CollectionKind, CollectionCopy> = {
  watchlist: {
    title: 'My Watchlist',
    countVerb: 'saved',
    emptyTitle: (mediaLabel, isCollectionEmpty) =>
      isCollectionEmpty ? 'Your watchlist is empty' : `No ${mediaLabel} in your watchlist`,
    emptyHint: (mediaLabel, isCollectionEmpty) =>
      isCollectionEmpty
        ? `Start adding ${mediaLabel} by clicking the star on any detail page`
        : `Add some ${mediaLabel} to see them here`,
  },
  watched: {
    title: 'Watched',
    countVerb: 'watched',
    emptyTitle: (mediaLabel, isCollectionEmpty) =>
      isCollectionEmpty ? "You haven't watched anything yet" : `No ${mediaLabel} watched yet`,
    emptyHint: (mediaLabel, isCollectionEmpty) =>
      isCollectionEmpty
        ? `Mark ${mediaLabel} as watched from any detail page to track them here`
        : `Mark some ${mediaLabel} as watched to see them here`,
  },
};

function useCollectionUrlState() {
  const [urlState] = useQueryStates(
    {
      mediaType: parseAsString.withDefault('movie'),
      page: parseAsInteger.withDefault(1),
    },
    {
      history: 'push',
    },
  );

  return { mediaType: urlState.mediaType as MediaType, page: urlState.page };
}

const EMPTY_PAGE = { items: [] as CollectionPage['items'], totalPages: 0 };

function useCollectionPage(collection: CollectionKind, mediaType: MediaType, page: number) {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.collections.list(collection, mediaType, page),
    queryFn: () => getCollectionPage(collection, mediaType, page),
    staleTime: COLLECTION_STALE_TIME,
    gcTime: COLLECTION_GC_TIME,
  });

  return { ...(data ?? EMPTY_PAGE), isLoading };
}

function useCollectionCount(collection: CollectionKind, mediaType: MediaType) {
  const { data = 0 } = useQuery({
    queryKey: queryKeys.collections.count(collection, mediaType),
    queryFn: () => getCollectionCount(collection, mediaType),
    staleTime: COLLECTION_STALE_TIME,
    gcTime: COLLECTION_GC_TIME,
  });

  return data;
}

type CollectionSummaryProps = {
  mediaType: MediaType;
  typeCount: number;
  totalItems: number;
  countVerb: string;
};

function CollectionSummary({ mediaType, typeCount, totalItems, countVerb }: CollectionSummaryProps) {
  const meta = MEDIA_META[mediaType];

  return (
    <div className="flex items-center gap-2">
      <p className="text-zinc-400">
        {typeCount} {typeCount === 1 ? meta.singular : meta.plural} {countVerb}
      </p>
      {totalItems > 0 && (
        <span className="text-zinc-500">
          • Total: {totalItems} item{totalItems !== 1 ? 's' : ''}
        </span>
      )}
    </div>
  );
}

type CollectionEmptyStateProps = {
  mediaType: MediaType;
  isCollectionEmpty: boolean;
  copy: CollectionCopy;
};

function CollectionEmptyState({ mediaType, isCollectionEmpty, copy }: CollectionEmptyStateProps) {
  const meta = MEDIA_META[mediaType];

  return (
    <div className="py-12 text-center">
      <div className="mb-4 text-6xl opacity-50">{meta.emoji}</div>
      <h2 className="mb-2 text-xl font-semibold">
        {copy.emptyTitle(meta.plural, isCollectionEmpty)}
      </h2>
      <p className="mb-6 text-zinc-400">{copy.emptyHint(meta.plural, isCollectionEmpty)}</p>
      <Link
        href={`/discover?mediaType=${mediaType}`}
        className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
      >
        Explore {meta.explore}
      </Link>
    </div>
  );
}

type CollectionGridProps = {
  items: CollectionPage['items'];
  userId?: string;
};

function CollectionGrid({ items, userId }: CollectionGridProps) {
  return (
    <div id="content-container" className="grid grid-cols-2 gap-4 @3xl:grid-cols-4 @8xl:grid-cols-5">
      {items.map((item) => (
        <ItemCard
          key={item.id}
          resource={item.resource}
          type={item.resourceType as MediaType}
          userId={userId}
        />
      ))}
    </div>
  );
}

type CollectionBodyProps = {
  isLoading: boolean;
  items: CollectionPage['items'];
  mediaType: MediaType;
  totalItems: number;
  copy: CollectionCopy;
  userId?: string;
};

function CollectionBody({ isLoading, items, mediaType, totalItems, copy, userId }: CollectionBodyProps) {
  if (isLoading) {
    return <PosterSkeletonGrid />;
  }

  if (items.length === 0) {
    return (
      <CollectionEmptyState mediaType={mediaType} isCollectionEmpty={totalItems === 0} copy={copy} />
    );
  }

  return <CollectionGrid items={items} userId={userId} />;
}

type CollectionContentProps = {
  collection: CollectionKind;
  userId?: string;
};

/**
 * Client content for a user collection page (watchlist, watched). URL state
 * (media type, page) lives in nuqs; changing it re-keys the React Query
 * fetches against the collection server functions.
 */
export function CollectionContent({ collection, userId }: CollectionContentProps) {
  const copy = COLLECTION_COPY[collection];
  const { mediaType, page } = useCollectionUrlState();

  useScrollOnPageChange(page);

  const { items, totalPages, isLoading } = useCollectionPage(collection, mediaType, page);
  const totalMovies = useCollectionCount(collection, 'movie');
  const totalTvShows = useCollectionCount(collection, 'tv');

  const totalItems = totalMovies + totalTvShows;
  const showPagination = items.length > 0 && totalPages > 1;

  return (
    <div className="@container w-full">
      <div className="mb-8">
        <div className="mb-4 flex items-center gap-4">
          <SectionTitle>{copy.title}</SectionTitle>
        </div>

        <div className="flex flex-col gap-4 @2xl:flex-row @2xl:items-center @2xl:justify-between">
          <CollectionSummary
            mediaType={mediaType}
            typeCount={mediaType === 'movie' ? totalMovies : totalTvShows}
            totalItems={totalItems}
            countVerb={copy.countVerb}
          />

          <MediaTypeSelector currentMediaType={mediaType} />
        </div>
      </div>

      <CollectionBody
        isLoading={isLoading}
        items={items}
        mediaType={mediaType}
        totalItems={totalItems}
        copy={copy}
        userId={userId}
      />

      {showPagination && <PaginationControls totalPages={totalPages} pageType={collection} />}
    </div>
  );
}
