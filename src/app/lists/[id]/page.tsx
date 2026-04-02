import ItemCard from '@/components/item-card';
import PersonCard from '@/components/person-card';
import { getUser } from '@/lib/auth-server';
import { getListDetailsWithResources } from '@/lib/lists';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ListDetailsContent } from './list-details-content';

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

  const listData = await getListDetailsWithResources(id, page);

  if (listData.totalPages > 0 && page > listData.totalPages) {
    redirect(`/lists/${id}?page=${listData.totalPages}`);
  }

  const grid =
    listData.itemCount === 0 ? (
      <div className="py-12 text-center col-span-full">
        <div className="mb-4 text-6xl opacity-50">{listData.emoji}</div>
        <h2 className="mb-2 text-xl font-semibold">This list is empty</h2>
        <p className="mb-6 text-zinc-400">
          Add movies, TV shows, or people by clicking the list button on any content
        </p>
        <Link
          href="/discover"
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium shadow transition-colors"
        >
          Explore Movies &amp; TV Shows
        </Link>
      </div>
    ) : (
      <div
        id="content-container"
        className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
      >
        {listData.allItems.map((item) =>
          item.resourceType === 'person' ? (
            <PersonCard
              person={item}
              userId={user?.id}
              showListButton={false}
              listId={id}
              key={`person-${item.id}`}
            />
          ) : (
            <ItemCard
              resource={item}
              type={item.resourceType}
              userId={user?.id}
              showListButton={false}
              listId={id}
              key={`${item.resourceType}-${item.id}`}
            />
          ),
        )}
      </div>
    );

  return (
    <ListDetailsContent
      listId={id}
      userId={user?.id}
      grid={grid}
      listName={listData.name}
      listDescription={listData.description}
      listEmoji={listData.emoji}
      listItemCount={listData.itemCount}
      totalPages={listData.totalPages}
      createdAt={listData.createdAt.toLocaleDateString()}
    />
  );
}
