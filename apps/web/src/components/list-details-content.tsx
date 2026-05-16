'use client';

import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';

import { DeleteListButton } from '@/components/delete-list-button';
import { EditListDialog } from '@/components/edit-list-dialog';
import ItemCard from '@/components/item-card';
import { PaginationControls } from '@/components/pagination-controls';
import PersonCard from '@/components/person-card';
import { Route } from '@/routes/lists/$id';
import SectionTitle from '@movies/ui/components/section-title';
import { Skeleton } from '@movies/ui/components/skeleton';
import { useScrollOnPageChange } from '@movies/ui/hooks/use-scroll-on-page-change';
import { orpc } from '@/utils/orpc';

type ListDetailsContentProps = {
  listId: string;
  userId?: string;
};

export function ListDetailsContent({ listId, userId }: ListDetailsContentProps) {
  const { page } = Route.useSearch();

  useScrollOnPageChange(page);

  const { data: paginatedList, isLoading } = useQuery(
    orpc.lists.detailWithResources.queryOptions({ input: { listId, page } }),
  );

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
              • Created {new Date(paginatedList.createdAt).toLocaleDateString()}
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
            Add movies, TV shows, or people by clicking the list button on any content
          </p>
          <Link
            to="/discover/$"
            params={{ _splat: '' }}
            search={{ mediaType: 'movie', page: 1 }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
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
                person={item as any}
                userId={userId}
                showListButton={false}
                listId={paginatedList.id}
                key={`${item.resourceType}-${item.id}`}
              />
            ) : (
              <ItemCard
                resource={item as any}
                type={item.resourceType}
                userId={userId}
                showListButton={false}
                listId={paginatedList.id}
                key={`${item.resourceType}-${item.id}`}
              />
            ),
          )}
        </div>
      )}

      {paginatedList.itemCount > 0 && totalPages > 1 && (
        <PaginationControls totalPages={totalPages} currentPage={page} />
      )}
    </div>
  );
}
