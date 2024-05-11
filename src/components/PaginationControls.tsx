'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import ChevronLeft from '@/icons/ChevronLeft';
import ChevronRight from '@/icons/ChevronRight';

type PaginationControls = {
  totalPages: number;
};

export function PaginationControls({ totalPages }: PaginationControls) {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const page = searchParams.get('page') ?? '1';
  const currentPageNumber = Number(page);
  const hasPrevPage = currentPageNumber > 1;
  const hasNextPage = currentPageNumber < totalPages;

  let currentGenreId = 0;
  if (params.genreId && params.genreId.length > 0) {
    currentGenreId = Number(params.genreId);
  }

  function handleSwitchPage(pageNumber: number) {
    let newSearchParams: string;
    const q = searchParams.get('q');

    if (q !== null) {
      newSearchParams = new URLSearchParams({
        q,
        page: String(pageNumber),
      }).toString();
    } else {
      newSearchParams = new URLSearchParams({
        page: String(pageNumber),
      }).toString();
    }

    if (currentGenreId !== 0) {
      return `${currentGenreId}?${newSearchParams}`;
    } else {
      return `?${newSearchParams}`;
    }
  }

  return (
    <>
      {totalPages > 1 && (
        <nav className="mb-3 mt-6 flex items-center justify-center gap-4">
          <a
            className="rounded border border-solid border-neutral-50 p-2 hover:bg-neutral-50 hover:text-gray-950"
            href={handleSwitchPage(Number(page) - 1)}
          >
            <div className="sr-only">Previous page</div>
            <ChevronLeft />
          </a>
          <div>
            {page}
            {' / '}
            {totalPages}
          </div>
          <a
            className="rounded border border-solid border-neutral-50 p-2 hover:bg-neutral-50 hover:text-gray-950"
            href={handleSwitchPage(Number(page) + 1)}
          >
            <div className="sr-only">Next page</div>
            <ChevronRight />
          </a>
        </nav>
      )}
    </>
  );
}
