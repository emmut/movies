'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { parseAsArrayOf, parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { useState } from 'react';

import { DeleteListButton } from '@/components/delete-list-button';
import { EditListDialog } from '@/components/edit-list-dialog';
import { ListItemsGrid } from '@/components/list-items-grid';
import { PaginationControls } from '@/components/pagination-controls';
import { ReorderButton } from '@/components/reorder-button';
import SectionTitle from '@/components/section-title';
import { Skeleton } from '@/components/ui/skeleton';
import WatchProviderFilter from '@/components/watch-provider-filter';
import { useReorderableItems } from '@/hooks/use-reorderable-items';
import { ITEMS_PER_PAGE } from '@/lib/config';
import { moveListItem } from '@/lib/lists';
import { queryKeys } from '@/lib/query-keys';
import { activeWatchProviderFilter } from '@/lib/watch-provider-search-params';
import { MovieDetails } from '@/types/movie';
import { PersonDetails } from '@/types/person';
import { TvDetails } from '@/types/tv-show';
import type { WatchProvider } from '@/types/watch-provider';

export type ListItem =
  | (MovieDetails & { resourceType: 'movie'; listItemId: string })
  | (TvDetails & { resourceType: 'tv'; listItemId: string })
  | (PersonDetails & { resourceType: 'person'; listItemId: string });

type ListDetailsData = {
  id: string;
  name: string;
  description: string | null;
  emoji: string;
  createdAt: Date;
  updatedAt: Date;
  itemCount: number;
  totalPages: number;
  allItems: ListItem[];
};

type ListDetailsContentProps = {
  listId: string;
  userId?: string;
  fetchListDetailsAction: (
    listId: string,
    page: number,
    watchProviders?: number[],
    watchRegion?: string,
  ) => Promise<ListDetailsData>;
  watchProviders: WatchProvider[];
  userRegion: string;
};

/**
 * Client component that handles the list details page content with React Query.
 * Uses nuqs to manage URL state, which automatically triggers React Query refetches.
 */
export function ListDetailsContent({
  listId,
  userId,
  fetchListDetailsAction,
  watchProviders,
  userRegion,
}: ListDetailsContentProps) {
  // Use nuqs to manage URL state
  const [urlState] = useQueryStates(
    {
      page: parseAsInteger.withDefault(1),
      with_watch_providers: parseAsArrayOf(parseAsInteger).withDefault([]),
      watch_region: parseAsString.withDefault(userRegion),
    },
    {
      history: 'push',
    },
  );

  const page = urlState.page;

  // Normalized exactly like the server shell computes them, so the query key
  // matches the prefetch after hydration.
  const { activeProviders, activeRegion } = activeWatchProviderFilter(
    urlState.with_watch_providers,
    urlState.watch_region,
  );
  const isProviderFiltered = activeProviders !== undefined;

  const { data: list, isLoading } = useQuery({
    queryKey: queryKeys.lists.detail(listId, page, activeProviders, activeRegion),
    queryFn: () => fetchListDetailsAction(listId, page, activeProviders, activeRegion),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });

  if (isLoading || !list) {
    return <ListDetailsSkeleton />;
  }

  return (
    <ListDetailsView
      list={list}
      page={page}
      userId={userId}
      watchProviders={watchProviders}
      userRegion={userRegion}
      isProviderFiltered={isProviderFiltered}
    />
  );
}

function ListDetailsSkeleton() {
  return (
    <div className="@container w-full">
      <div className="mb-8">
        <Skeleton className="mb-4 h-10 w-64" />
        <Skeleton className="h-6 w-96" />
      </div>
      <div className="grid grid-cols-2 gap-4 @3xl:grid-cols-4 @8xl:grid-cols-5">
        {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="aspect-2/3 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}

interface ListDetailsViewProps {
  list: ListDetailsData;
  page: number;
  userId?: string;
  watchProviders: WatchProvider[];
  userRegion: string;
  isProviderFiltered: boolean;
}

function ListDetailsView({
  list,
  page,
  userId,
  watchProviders,
  userRegion,
  isProviderFiltered,
}: ListDetailsViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  const offset = (page - 1) * ITEMS_PER_PAGE;
  const { localItems, isPending, move } = useReorderableItems(
    list.allItems,
    offset,
    async (itemId, globalIndex) => {
      await moveListItem(itemId, globalIndex);
      // Fire-and-forget: awaiting ties pending to unrelated refetches.
      queryClient.invalidateQueries({ queryKey: queryKeys.lists.all });
    },
  );

  return (
    <div className="@container w-full">
      <ListDetailsHeader
        listName={list.name}
        listId={list.id}
        listDescription={list.description}
        listEmoji={list.emoji}
        itemCount={list.itemCount}
        isEditing={isEditing}
        onToggleEditing={() => setIsEditing((value) => !value)}
        watchProviders={watchProviders}
        userRegion={userRegion}
        isProviderFiltered={isProviderFiltered}
      />

      <ListDetailsBody
        list={list}
        items={localItems}
        offset={offset}
        isPending={isPending}
        isEditing={isEditing && !isProviderFiltered}
        isProviderFiltered={isProviderFiltered}
        onMove={move}
        userId={userId}
      />

      {list.itemCount > 0 && list.totalPages > 1 && (
        <PaginationControls totalPages={list.totalPages} pageType="lists" />
      )}
    </div>
  );
}

function ListDetailsBody({
  list,
  items,
  offset,
  isPending,
  isEditing,
  isProviderFiltered,
  onMove,
  userId,
}: {
  list: ListDetailsData;
  items: ListItem[];
  offset: number;
  isPending: boolean;
  isEditing: boolean;
  isProviderFiltered: boolean;
  onMove: (id: string, toIndex: number) => void;
  userId?: string;
}) {
  if (list.itemCount === 0) {
    return <EmptyListState emoji={list.emoji} />;
  }

  if (items.length === 0 && isProviderFiltered) {
    return <FilteredEmptyListState emoji={list.emoji} />;
  }

  return (
    <ListItemsGrid
      items={items}
      offset={offset}
      itemCount={list.itemCount}
      isPending={isPending}
      editing={isEditing}
      onMove={onMove}
      userId={userId}
      listId={list.id}
    />
  );
}

interface ListDetailsHeaderProps {
  listName: string;
  listId: string;
  listDescription: string | null;
  listEmoji: string;
  itemCount: number;
  isEditing: boolean;
  onToggleEditing: () => void;
  watchProviders: WatchProvider[];
  userRegion: string;
  isProviderFiltered: boolean;
}

function ListDetailsHeader({
  listName,
  listId,
  listDescription,
  listEmoji,
  itemCount,
  isEditing,
  onToggleEditing,
  watchProviders,
  userRegion,
  isProviderFiltered,
}: ListDetailsHeaderProps) {
  return (
    <div className="mb-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <SectionTitle>{listName}</SectionTitle>
        <div className="flex flex-wrap items-end gap-2">
          {/* Reordering a provider-filtered view is disabled: the visible rows
              are a non-contiguous slice, so page offsets no longer map to
              positions in the full manual order. */}
          {itemCount > 0 && !isProviderFiltered && (
            <ReorderButton isEditing={isEditing} onToggleEditing={onToggleEditing} />
          )}
          <EditListDialog
            listId={listId}
            listName={listName}
            listDescription={listDescription}
            listEmoji={listEmoji}
          />
          <DeleteListButton
            listId={listId}
            listName={listName}
            itemCount={itemCount}
            redirectAfterDelete={true}
          />
          <WatchProviderFilter providers={watchProviders} userRegion={userRegion} />
        </div>
      </div>
    </div>
  );
}

function FilteredEmptyListState({ emoji }: { emoji: string }) {
  return (
    <div className="py-12 text-center">
      <div className="mb-4 text-6xl opacity-50">{emoji}</div>
      <h2 className="mb-2 text-xl font-semibold">
        Nothing in this list is on the selected watch providers
      </h2>
      <p className="mb-6 text-zinc-400">
        Try other watch providers or clear the filter to see everything
      </p>
    </div>
  );
}

function EmptyListState({ emoji }: { emoji: string }) {
  return (
    <div className="py-12 text-center">
      <div className="mb-4 text-6xl opacity-50">{emoji}</div>
      <h2 className="mb-2 text-xl font-semibold">This list is empty</h2>
      <p className="mb-6 text-zinc-400">
        Add movies, TV shows, or people by clicking the list button on any content
      </p>
      <Link
        href="/discover"
        className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
      >
        Explore Movies & TV Shows
      </Link>
    </div>
  );
}
