'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, GripVertical } from 'lucide-react';
import Link from 'next/link';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { useMemo, useState } from 'react';

import { ListItemsGrid } from '@/components/list-items-grid';
import MediaTypeSelector from '@/components/media-type-selector';
import { PaginationControls } from '@/components/pagination-controls';
import { PosterSkeletonGrid } from '@/components/poster-skeleton-grid';
import SectionTitle from '@/components/section-title';
import { Button } from '@/components/ui/button';
import { useReorderableItems } from '@/hooks/use-reorderable-items';
import { useScrollOnPageChange } from '@/hooks/use-scroll-on-page-change';
import { ITEMS_PER_PAGE } from '@/lib/config';
import { moveListItem } from '@/lib/lists';
import { queryKeys } from '@/lib/query-keys';
import {
  getSystemListCount,
  getSystemListWithResourceDetailsPaginated,
} from '@/lib/system-list-queries';
import type { ListItem } from '@/app/lists/[id]/list-details-content';
import type { SystemListType } from '@/lib/validations';
import { MovieDetails } from '@/types/movie';
import { TvDetails } from '@/types/tv-show';

const CONTENT_COPY: Record<
  SystemListType,
  {
    title: string;
    countNoun: string;
    emptyTitleAll: string;
    emptyTitleMedia: (mediaLabel: string) => string;
    emptyHintAll: (mediaLabel: string) => string;
    emptyHintMedia: (mediaLabel: string) => string;
  }
> = {
  watchlist: {
    title: 'My Watchlist',
    countNoun: 'saved',
    emptyTitleAll: 'Your watchlist is empty',
    emptyTitleMedia: (mediaLabel) => `No ${mediaLabel} in your watchlist`,
    emptyHintAll: (mediaLabel) =>
      `Start adding ${mediaLabel} by clicking the star on any detail page`,
    emptyHintMedia: (mediaLabel) => `Add some ${mediaLabel} to see them here`,
  },
  watched: {
    title: 'Watched',
    countNoun: 'watched',
    emptyTitleAll: "You haven't watched anything yet",
    emptyTitleMedia: (mediaLabel) => `No ${mediaLabel} watched yet`,
    emptyHintAll: (mediaLabel) =>
      `Mark ${mediaLabel} as watched from any detail page to track them here`,
    emptyHintMedia: (mediaLabel) => `Mark some ${mediaLabel} as watched to see them here`,
  },
};

const MEDIA_META = {
  movie: { emoji: '🎬', label: 'movies', exploreLabel: 'Explore Movies', countNoun: 'movie' },
  tv: { emoji: '📺', label: 'TV shows', exploreLabel: 'Explore TV Shows', countNoun: 'TV show' },
} as const;

// React Query timings shared by the prefetches and the client queries so
// hydration and refetching agree; system lists change infrequently.
export const SYSTEM_LIST_QUERY_TIMES = {
  staleTime: 1000 * 60 * 5, // 5 minutes
  gcTime: 1000 * 60 * 30, // 30 minutes
};

function formatCount(count: number, noun: string) {
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}

const EMPTY_RESULT: { items: SystemListItem[]; totalPages: number } = {
  items: [],
  totalPages: 0,
};

type SystemListContentProps = {
  listType: SystemListType;
  userId?: string;
};

/**
 * Client component that renders a system list page (watchlist, watched) with
 * React Query. Uses nuqs to manage URL state, which automatically triggers
 * React Query refetches.
 */
export function SystemListContent({ listType, userId }: SystemListContentProps) {
  const [urlState] = useQueryStates(
    {
      mediaType: parseAsString.withDefault('movie'),
      page: parseAsInteger.withDefault(1),
    },
    {
      history: 'push',
    },
  );

  const mediaType = urlState.mediaType as 'movie' | 'tv';
  const page = urlState.page;

  useScrollOnPageChange(page);

  const { data: paginatedData, isLoading } = useQuery({
    queryKey: queryKeys[listType].list(mediaType, page),
    queryFn: () => getSystemListWithResourceDetailsPaginated(listType, mediaType, page),
    ...SYSTEM_LIST_QUERY_TIMES,
  });

  const { data: totalMovies = 0 } = useQuery({
    queryKey: queryKeys[listType].count('movie'),
    queryFn: () => getSystemListCount(listType, 'movie'),
    ...SYSTEM_LIST_QUERY_TIMES,
  });

  const { data: totalTvShows = 0 } = useQuery({
    queryKey: queryKeys[listType].count('tv'),
    queryFn: () => getSystemListCount(listType, 'tv'),
    ...SYSTEM_LIST_QUERY_TIMES,
  });

  const totalItems = totalMovies + totalTvShows;
  const { items, totalPages } = paginatedData ?? EMPTY_RESULT;

  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  const offset = (page - 1) * ITEMS_PER_PAGE;
  const totalForMedia = mediaType === 'movie' ? totalMovies : totalTvShows;

  // Map raw rows to the ListItem shape the reorder grid expects.
  const mappedItems = useMemo(
    () =>
      items.map(
        (item) =>
          ({
            ...(item.resource as MovieDetails | TvDetails),
            resourceType: item.resourceType as 'movie' | 'tv',
            listItemId: item.id,
          }) as ListItem,
      ),
    [items],
  );

  const { localItems, isPending, move } = useReorderableItems(
    mappedItems,
    offset,
    async (itemId, globalIndex) => {
      await moveListItem(itemId, globalIndex, mediaType);
      // Fire-and-forget: awaiting ties pending to unrelated refetches.
      queryClient.invalidateQueries({ queryKey: queryKeys[listType].all });
    },
  );

  const gridItems = isEditing ? localItems : mappedItems;

  return (
    <div className="@container w-full">
      <SystemListHeader
        listType={listType}
        mediaType={mediaType}
        totalMovies={totalMovies}
        totalTvShows={totalTvShows}
        isEditing={isEditing}
        onToggleEditing={() => setIsEditing((value) => !value)}
      />

      <SystemListBody
        listType={listType}
        mediaType={mediaType}
        userId={userId}
        isLoading={isLoading}
        isAllEmpty={totalItems === 0}
        items={gridItems}
        totalPages={totalPages}
        itemCount={totalForMedia}
        offset={offset}
        isEditing={isEditing}
        isPending={isPending}
        onMove={move}
      />
    </div>
  );
}

function SystemListHeader({
  listType,
  mediaType,
  totalMovies,
  totalTvShows,
  isEditing,
  onToggleEditing,
}: {
  listType: SystemListType;
  mediaType: 'movie' | 'tv';
  totalMovies: number;
  totalTvShows: number;
  isEditing: boolean;
  onToggleEditing: () => void;
}) {
  const totalItems = totalMovies + totalTvShows;
  const mediaTypeCount = mediaType === 'movie' ? totalMovies : totalTvShows;

  return (
    <div className="mb-8">
      <div className="mb-4 flex items-center gap-4">
        <SectionTitle>{CONTENT_COPY[listType].title}</SectionTitle>
      </div>

      <div className="flex flex-col gap-4 @2xl:flex-row @2xl:items-center @2xl:justify-between">
        <div className="flex items-center gap-2">
          <p className="text-zinc-400">
            {formatCount(mediaTypeCount, MEDIA_META[mediaType].countNoun)}{' '}
            {CONTENT_COPY[listType].countNoun}
          </p>
          {totalItems > 0 && (
            <span className="text-zinc-500">• Total: {formatCount(totalItems, 'item')}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {totalItems > 0 && (
            <ReorderButton isEditing={isEditing} onToggleEditing={onToggleEditing} />
          )}
          <MediaTypeSelector currentMediaType={mediaType} />
        </div>
      </div>
    </div>
  );
}

function ReorderButton({
  isEditing,
  onToggleEditing,
}: {
  isEditing: boolean;
  onToggleEditing: () => void;
}) {
  return (
    <Button
      variant={isEditing ? 'default' : 'secondary'}
      size="sm"
      onClick={onToggleEditing}
      aria-pressed={isEditing}
    >
      {isEditing ? (
        <>
          <Check className="h-4 w-4" />
          Done
        </>
      ) : (
        <>
          <GripVertical className="h-4 w-4" />
          Reorder items
        </>
      )}
    </Button>
  );
}

type SystemListItem = NonNullable<
  Awaited<ReturnType<typeof getSystemListWithResourceDetailsPaginated>>
>['items'][number];

function SystemListBody({
  listType,
  mediaType,
  userId,
  isLoading,
  isAllEmpty,
  items,
  totalPages,
  itemCount,
  offset,
  isEditing,
  isPending,
  onMove,
}: {
  listType: SystemListType;
  mediaType: 'movie' | 'tv';
  userId?: string;
  isLoading: boolean;
  isAllEmpty: boolean;
  items: ListItem[];
  totalPages: number;
  itemCount: number;
  offset: number;
  isEditing: boolean;
  isPending: boolean;
  onMove: (id: string, toIndex: number) => void;
}) {
  if (isLoading) {
    return <PosterSkeletonGrid />;
  }

  if (items.length === 0) {
    return <EmptyState listType={listType} mediaType={mediaType} isAllEmpty={isAllEmpty} />;
  }

  return (
    <>
      <ListItemsGrid
        items={items}
        offset={offset}
        itemCount={itemCount}
        isPending={isPending}
        editing={isEditing}
        onMove={onMove}
        userId={userId}
      />

      {totalPages > 1 && <PaginationControls totalPages={totalPages} pageType={listType} />}
    </>
  );
}

function EmptyState({
  listType,
  mediaType,
  isAllEmpty,
}: {
  listType: SystemListType;
  mediaType: 'movie' | 'tv';
  isAllEmpty: boolean;
}) {
  const copy = CONTENT_COPY[listType];
  const meta = MEDIA_META[mediaType];

  return (
    <div className="py-12 text-center">
      <div className="mb-4 text-6xl opacity-50">{meta.emoji}</div>
      <h2 className="mb-2 text-xl font-semibold">
        {isAllEmpty ? copy.emptyTitleAll : copy.emptyTitleMedia(meta.label)}
      </h2>
      <p className="mb-6 text-zinc-400">
        {isAllEmpty ? copy.emptyHintAll(meta.label) : copy.emptyHintMedia(meta.label)}
      </p>
      <Link
        href={`/discover?mediaType=${mediaType}`}
        className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
      >
        {meta.exploreLabel}
      </Link>
    </div>
  );
}
