import { useQuery } from '@tanstack/react-query';
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router';
import { z } from 'zod';

import { authClient } from '@/lib/auth-client';
import { CreateListDialog } from '@/components/create-list-dialog';
import { ListsGrid } from '@/components/lists-grid';
import { PaginationControls } from '@/components/pagination-controls';
import SectionTitle from '@movies/ui/components/section-title';
import { orpc } from '@/utils/orpc';

export const Route = createFileRoute('/lists')({
  validateSearch: z.object({ page: z.coerce.number().int().min(1).default(1) }),
  component: ListsRoute,
});

function ListsRoute() {
  const { page } = Route.useSearch();
  const navigate = useNavigate();
  const { data: session, isPending } = authClient.useSession();

  const lists = useQuery(orpc.lists.paginated.queryOptions({ input: { page } }));
  const count = useQuery(orpc.lists.count.queryOptions());

  if (isPending) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-600 border-t-white" />
      </div>
    );
  }

  if (!session?.user) {
    navigate({ to: '/login' });
    return null;
  }

  const totalListsCount = count.data ?? 0;
  const totalPages = lists.data?.totalPages ?? 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SectionTitle>My Lists</SectionTitle>
        <CreateListDialog />
      </div>

      <div className="flex items-center gap-2">
        <p className="text-zinc-400">
          {totalListsCount} list{totalListsCount !== 1 ? 's' : ''} created
        </p>
      </div>

      {(lists.data?.lists.length ?? 0) === 0 && !lists.isLoading ? (
        <div className="py-12 text-center">
          <div className="mb-4 text-6xl opacity-50">📝</div>
          <h2 className="mb-2 text-xl font-semibold">You haven&apos;t created any lists yet</h2>
          <p className="mb-6 text-zinc-400">
            Start creating lists by clicking the button above or the list button on any movie or TV
            show
          </p>
          <Link
            to="/discover/$"
            params={{ _splat: '' }}
            search={{ mediaType: 'movie', page: 1 }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            Explore Movies &amp; TV Shows
          </Link>
        </div>
      ) : (
        <div>
          <ListsGrid lists={lists.data?.lists ?? []} />
          {totalPages > 1 && <PaginationControls totalPages={totalPages} currentPage={page} />}
        </div>
      )}
    </div>
  );
}
