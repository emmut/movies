import { CreateListDialog } from '@/components/create-list-dialog';
import { ListsGrid } from '@/components/lists-grid';
import SectionTitle from '@/components/section-title';
import { getUser } from '@/lib/auth-server';
import { getUserLists } from '@/lib/lists';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function ListsPage() {
  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  const lists = await getUserLists();
  const totalLists = lists.length;
  const totalItems = lists.reduce((sum, list) => sum + list.itemCount, 0);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <SectionTitle>My Lists</SectionTitle>
          <CreateListDialog />
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <p className="text-zinc-400">
              {totalLists} list{totalLists !== 1 ? 's' : ''} created
            </p>
            {totalItems > 0 && (
              <span className="text-zinc-500">
                • Total: {totalItems} item{totalItems !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </div>

      {lists.length === 0 ? (
        <div className="py-12 text-center">
          <div className="mb-4 text-6xl opacity-50">📝</div>
          <h2 className="mb-2 text-xl font-semibold">
            You haven&apos;t created any lists yet
          </h2>
          <p className="mb-6 text-zinc-400">
            Start creating lists by clicking the button above or the list button
            on any movie or TV show
          </p>
          <Link
            href="/discover"
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium shadow transition-colors"
          >
            Explore Movies & TV Shows
          </Link>
        </div>
      ) : (
        <ListsGrid lists={lists} />
      )}
    </div>
  );
}
