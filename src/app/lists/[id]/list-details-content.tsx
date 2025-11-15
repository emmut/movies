'use client';

import { DeleteListButton } from '@/components/delete-list-button';
import { EditListDialog } from '@/components/edit-list-dialog';
import ItemCard from '@/components/item-card';
import { PaginationControls } from '@/components/pagination-controls';
import PersonCard from '@/components/person-card';
import SectionTitle from '@/components/section-title';
import { Skeleton } from '@/components/ui/skeleton';
import { queryKeys } from '@/lib/query-keys';
import { MovieDetails } from '@/types/movie';
import { PersonDetails } from '@/types/person';
import { TvDetails } from '@/types/tv-show';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { parseAsInteger, useQueryStates } from 'nuqs';

type ListItem =
  | (MovieDetails & { resourceType: 'movie' })
  | (TvDetails & { resourceType: 'tv' })
  | (PersonDetails & { resourceType: 'person' });

type ListDetailsContentProps = {
  listId: string;
  userId?: string;
  fetchListDetails: (
    listId: string,
    page: number
  ) => Promise<{
    id: string;
    name: string;
    description: string | null;
    emoji: string;
    createdAt: Date;
    updatedAt: Date;
    itemCount: number;
    totalPages: number;
    allItems: ListItem[];
  }>;
};

/**
 * Client component that handles the list details page content with React Query.
 * Uses nuqs to manage URL state, which automatically triggers React Query refetches.
 */
export function ListDetailsContent({
  listId,
  userId,
  fetchListDetails,
}: ListDetailsContentProps) {
  // Use nuqs to manage URL state
  const [urlState] = useQueryStates(
    {
      page: parseAsInteger.withDefault(1),
    },
    {
      history: 'push',
    }
  );

  const page = urlState.page;

  // Fetch paginated list details
  const { data: paginatedList, isLoading } = useQuery({
    queryKey: queryKeys.lists.detail(listId, page),
    queryFn: () => fetchListDetails(listId, page),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });

  if (isLoading || !paginatedList) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Skeleton className="mb-4 h-10 w-64" />
          <Skeleton className="h-6 w-96" />
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
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

  const { allItems, totalPages } = paginatedList;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <SectionTitle>{paginatedList.name}</SectionTitle>
          <div className="flex items-center gap-2">
            <EditListDialog
              listId={paginatedList.id}
              listName={paginatedList.name}
              listDescription={paginatedList.description}
              listEmoji={paginatedList.emoji}
            />
            <DeleteListButton
              listId={paginatedList.id}
              listName={paginatedList.name}
              itemCount={paginatedList.itemCount}
              redirectAfterDelete={true}
            />
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <p className="text-zinc-400">
              {paginatedList.itemCount} item
              {paginatedList.itemCount !== 1 ? 's' : ''} in this list
            </p>
            <span className="text-zinc-500">
              • Created {paginatedList.createdAt.toLocaleDateString()}
            </span>
          </div>
        </div>

        {paginatedList.description && (
          <p className="mt-4 text-zinc-300">{paginatedList.description}</p>
        )}
      </div>

      {paginatedList.itemCount === 0 ? (
        <div className="py-12 text-center">
          <div className="mb-4 text-6xl opacity-50">{paginatedList.emoji}</div>
          <h2 className="mb-2 text-xl font-semibold">This list is empty</h2>
          <p className="mb-6 text-zinc-400">
            Add movies, TV shows, or people by clicking the list button on any
            content
          </p>
          <Link
            href="/discover"
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium shadow transition-colors"
          >
            Explore Movies & TV Shows
          </Link>
        </div>
      ) : (
        <div
          id="content-container"
          className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
        >
          {allItems.map((item) =>
            item.resourceType === 'person' ? (
              <PersonCard
                person={item}
                userId={userId}
                showListButton={false}
                listId={paginatedList.id}
                key={`${item.resourceType}-${item.id}`}
              />
            ) : (
              <ItemCard
                resource={item}
                type={item.resourceType}
                userId={userId}
                showListButton={false}
                listId={paginatedList.id}
                key={`${item.resourceType}-${item.id}`}
              />
            )
          )}
        </div>
      )}

      {paginatedList.itemCount > 0 && totalPages > 1 && (
        <PaginationControls totalPages={totalPages} pageType="lists" />
      )}
    </div>
  );
}
