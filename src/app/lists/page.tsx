import { CreateListDialog } from '@/components/create-list-dialog';
import { ListsGrid } from '@/components/lists-grid';
import { PaginationControls } from '@/components/pagination-controls';
import SectionTitle from '@/components/section-title';
import { getUser } from '@/lib/auth-server';
import { getUserListCount, getUserListsPaginated } from '@/lib/lists';
import Link from 'next/link';
import { redirect } from 'next/navigation';

type ListsPageProps = {
  searchParams: Promise<{
    page?: string;
  }>;
};

export default async function ListsPage(props: ListsPageProps) {
  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  const searchParams = await props.searchParams;
  const page = Number(searchParams.page ?? '1');

  const [paginatedData, totalListsCount] = await Promise.all([
    getUserListsPaginated(page),
    getUserListCount(),
  ]);

  const { lists, totalPages } = paginatedData;

  // If requested page is beyond the last, canonicalize the URL
  if (paginatedData.totalPages > 0 && page > paginatedData.totalPages) {
    redirect(`/lists?page=${paginatedData.totalPages}`);
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <SectionTitle>My Lists</SectionTitle>
          <CreateListDialog />
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <p className="text-zinc-400">
              {totalListsCount} list{totalListsCount !== 1 ? 's' : ''} created
            </p>
            {totalListsCount > 0 && (
              <span className="text-zinc-500">
                • Total: {totalListsCount} item
                {totalListsCount !== 1 ? 's' : ''}
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
        <>
          <ListsGrid lists={lists} />
          {totalPages > 1 && (
            <PaginationControls totalPages={totalPages} pageType="lists" />
          )}
        </>
      )}
    </div>
  );
}
