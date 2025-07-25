import { DeleteListButton } from '@/components/delete-list-button';
import { EditListDialog } from '@/components/edit-list-dialog';
import PersonCard from '@/components/person-card';
import ResourceCard from '@/components/resource-card';
import SectionTitle from '@/components/section-title';
import { getUser } from '@/lib/auth-server';
import { getListDetails } from '@/lib/lists';
import { getMovieDetails } from '@/lib/movies';
import { getPersonDetails } from '@/lib/persons';
import { getTvShowDetails } from '@/lib/tv-shows';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function ListDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  const { id } = await params;
  const list = await getListDetails(id);

  // Fetch details for all items in the list
  const movieItems =
    list.items?.filter((item) => item.resourceType === 'movie') || [];
  const tvItems =
    list.items?.filter((item) => item.resourceType === 'tv') || [];
  const personItems =
    list.items?.filter((item) => item.resourceType === 'person') || [];

  const [movies, tvShows, persons] = await Promise.all([
    Promise.all(movieItems.map((item) => getMovieDetails(item.resourceId))),
    Promise.all(tvItems.map((item) => getTvShowDetails(item.resourceId))),
    Promise.all(personItems.map((item) => getPersonDetails(item.resourceId))),
  ]);

  const allItems = [
    ...movies.map((movie) => ({ ...movie, resourceType: 'movie' as const })),
    ...tvShows.map((show) => ({ ...show, resourceType: 'tv' as const })),
    ...persons.map((person) => ({
      ...person,
      resourceType: 'person' as const,
    })),
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <SectionTitle>{list.name}</SectionTitle>
          <div className="flex items-center gap-2">
            <EditListDialog
              listId={list.id}
              listName={list.name}
              listDescription={list.description}
              listEmoji={list.emoji}
            />
            <DeleteListButton
              listId={list.id}
              listName={list.name}
              itemCount={list.itemCount}
              redirectAfterDelete={true}
            />
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <p className="text-zinc-400">
              {list.itemCount} item{list.itemCount !== 1 ? 's' : ''} in this
              list
            </p>
            <span className="text-zinc-500">
              • Created {list.createdAt.toLocaleDateString()}
            </span>
          </div>
        </div>

        {list.description && (
          <p className="mt-4 text-zinc-300">{list.description}</p>
        )}
      </div>

      {list.itemCount === 0 ? (
        <div className="py-12 text-center">
          <div className="mb-4 text-6xl opacity-50">{list.emoji}</div>
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
                listId={list.id}
                key={`${item.resourceType}-${item.id}`}
              />
            ) : (
              <ResourceCard
                resource={item}
                type={item.resourceType}
                userId={user?.id}
                showListButton={false}
                listId={list.id}
                key={`${item.resourceType}-${item.id}`}
              />
            )
          )}
        </div>
      )}
    </div>
  );
}
