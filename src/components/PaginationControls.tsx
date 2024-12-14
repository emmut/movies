'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import ChevronLeft from '@/icons/ChevronLeft';
import ChevronRight from '@/icons/ChevronRight';
import clsx from 'clsx';

type PaginationControls = {
  totalPages: number;
};

export function PaginationControls({ totalPages }: PaginationControls) {
  const { replace } = useRouter();
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

  function buildPageUrl(pageNumber: number) {
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
            className={clsx([
              'rounded border border-solid border-neutral-50 p-2 hover:bg-neutral-50 hover:text-gray-950',
              !hasPrevPage && 'pointer-events-none opacity-40',
            ])}
            href={buildPageUrl(Number(page) - 1)}
            aria-disabled={!hasPrevPage}
          >
            <div className="sr-only">Previous page</div>
            <ChevronLeft />
          </a>

          <div className="grid grid-cols-1 grid-rows-1 rounded ring-offset-2 focus-within:ring-2">
            <span className="sr-only">Current page</span>
            <div className="col-start-1 col-end-1 row-start-1 row-end-1">
              {page}
              {' / '}
              {totalPages}
            </div>
            <select
              onChange={(e) => {
                const newPageUrl = buildPageUrl(Number(e.target.value));

                if (newPageUrl !== page) {
                  replace(newPageUrl);
                }
              }}
              className="z-10 col-start-1 col-end-1 row-start-1 row-end-1 appearance-none opacity-0"
            >
              {Array.from({ length: totalPages }, (_, i) => (
                <option key={i + 1} className="text-black" value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </select>
          </div>
          <a
            className={clsx([
              'rounded border border-solid border-neutral-50 p-2 hover:bg-neutral-50 hover:text-gray-950',
              !hasNextPage && 'pointer-events-none opacity-40',
            ])}
            href={buildPageUrl(Number(page) + 1)}
            aria-disabled={!hasNextPage}
          >
            <div className="sr-only">Next page</div>
            <ChevronRight />
          </a>
        </nav>
      )}
    </>
  );
}
