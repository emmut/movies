import { DeleteListButton } from '@/components/delete-list-button';
import { EditListDialog } from '@/components/edit-list-dialog';
import { RemoveFromListButton } from '@/components/remove-from-list-button';
import ResourceCard from '@/components/resource-card';
import SectionTitle from '@/components/section-title';
import { getUser } from '@/lib/auth-server';
import { getListDetails } from '@/lib/lists';
import { getMovieDetails } from '@/lib/movies';
import { getPersonDetails } from '@/lib/persons';
import { getTvShowDetails } from '@/lib/tv-shows';
import { formatImageUrl } from '@/lib/utils';
import { Star, User } from 'lucide-react';
import Image from 'next/image';
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
          {allItems.map((item) => (
            <div
              key={`${item.resourceType}-${item.id}`}
              className="group relative"
            >
              {item.resourceType === 'person' ? (
                <Link
                  href={`/person/${item.id}`}
                  className="group aspect-2/3 w-full flex-shrink-0 overflow-hidden rounded-lg border bg-zinc-900 transition-all duration-300 hover:scale-105 hover:border-blue-400 focus:scale-105 focus:border-blue-400 focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-black focus:outline-none"
                >
                  <div className="relative h-full w-full">
                    {item.profile_path ? (
                      <Image
                        className="object-cover"
                        src={formatImageUrl(item.profile_path, 500)}
                        alt={`Profile image of ${item.name}`}
                        fill
                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-zinc-800">
                        <div className="text-center text-zinc-400">
                          <div className="mb-2 text-4xl">
                            <User className="mx-auto h-12 w-12" />
                          </div>
                          <div className="text-sm font-semibold">No Photo</div>
                        </div>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100 group-focus:opacity-100" />

                    <div className="absolute right-0 bottom-0 left-0 p-3 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus:opacity-100">
                      <h3 className="mb-1 line-clamp-2 text-sm font-semibold">
                        {item.name}
                      </h3>
                      <div className="text-xs text-zinc-300">
                        <div className="mb-1">{item.known_for_department}</div>
                        {item.popularity && (
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-500" />
                            <span>{Math.round(item.popularity)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="absolute top-2 left-2 opacity-0 transition-opacity group-hover:opacity-100 group-focus:opacity-100">
                      <div className="rounded-full bg-blue-500/80 px-2 py-1 text-xs font-medium text-white">
                        Person
                      </div>
                    </div>
                  </div>
                </Link>
              ) : (
                <ResourceCard
                  resource={item}
                  type={item.resourceType}
                  userId={user?.id}
                />
              )}
              <div className="pointer-events-none absolute top-2 right-2 z-20 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                <RemoveFromListButton
                  listId={list.id}
                  mediaId={item.id}
                  mediaType={item.resourceType}
                  className="h-8 w-8"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
