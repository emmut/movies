import { DeleteListButton } from '@/components/delete-list-button';
import { EditListDialog } from '@/components/edit-list-dialog';
import ItemCard from '@/components/item-card';
import { PaginationControls } from '@/components/pagination-controls';
import PersonCard from '@/components/person-card';
import SectionTitle from '@/components/section-title';
import { getUser } from '@/lib/auth-server';
import { getListDetailsPaginated } from '@/lib/lists';
import { getMovieDetails } from '@/lib/movies';
import { getPersonDetails } from '@/lib/persons';
import { getTvShowDetails } from '@/lib/tv-shows';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function ListDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  const { id } = await params;
  const { page: pageParam } = await searchParams;
  const page = Number(pageParam ?? '1');

  const paginatedList = await getListDetailsPaginated(id, page);
  const { items: paginatedItems, totalPages } = paginatedList;

  // If requested page is beyond the last, canonicalize the URL
  if (paginatedList.totalPages > 0 && page > paginatedList.totalPages) {
    redirect(`/lists/${id}?page=${paginatedList.totalPages}`);
  }

  // Fetch details for paginated items only
  const movieItems =
    paginatedItems?.filter((item) => item.resourceType === 'movie') || [];
  const tvItems =
    paginatedItems?.filter((item) => item.resourceType === 'tv') || [];
  const personItems =
    paginatedItems?.filter((item) => item.resourceType === 'person') || [];

  const [movies, tvShows, persons] = await Promise.all([
    Promise.allSettled(
      movieItems.map((item) => getMovieDetails(item.resourceId))
    ),
    Promise.allSettled(
      tvItems.map((item) => getTvShowDetails(item.resourceId))
    ),
    Promise.allSettled(
      personItems.map((item) => getPersonDetails(item.resourceId))
    ),
  ]).then(
    ([movieResults, tvResults, personResults]) =>
      [
        movieResults
          .filter((result) => result.status === 'fulfilled')
          .map((result) => result.value),
        tvResults
          .filter((result) => result.status === 'fulfilled')
          .map((result) => result.value),
        personResults
          .filter((result) => result.status === 'fulfilled')
          .map((result) => result.value),
      ] as const
  );

  const allItems = [
    ...movies.map((movie) => ({
      ...movie,
      resourceType: 'movie' as const,
    })),
    ...tvShows.map((show) => ({
      ...show,
      resourceType: 'tv' as const,
    })),
    ...persons.map((person) => ({
      ...person,
      resourceType: 'person' as const,
    })),
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
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
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {allItems.map((item) =>
            item.resourceType === 'person' ? (
              <PersonCard
                person={item}
                userId={user?.id}
                showListButton={false}
                listId={paginatedList.id}
                key={`${item.resourceType}-${item.id}`}
              />
            ) : (
              <ItemCard
                resource={item}
                type={item.resourceType}
                userId={user?.id}
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
