'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import ChevronLeft from '@/icons/ChevronLeft';
import ChevronRight from '@/icons/ChevronRight';
import clsx from 'clsx';
import Link from 'next/link';

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
    const searchParamsObj: Record<string, string> = {
      page: String(pageNumber),
    };

    const q = searchParams.get('q');
    if (q !== null) {
      searchParamsObj.q = q;
    }

    const newSearchParams = new URLSearchParams(searchParamsObj).toString();
    return currentGenreId !== 0
      ? `/discover/${currentGenreId}?${newSearchParams}`
      : `/discover?${newSearchParams}`;
  }

  return (
    <>
      {totalPages > 1 && (
        <nav className="mt-6 mb-3 flex items-center justify-center gap-4">
          <Link
            className={clsx([
              'rounded-sm border border-solid border-neutral-50 p-2 hover:bg-neutral-50 hover:text-gray-950',
              !hasPrevPage && 'pointer-events-none opacity-40',
            ])}
            href={buildPageUrl(Number(page) - 1)}
            aria-disabled={!hasPrevPage}
          >
            <div className="sr-only">Previous page</div>
            <ChevronLeft />
          </Link>

          <div className="grid grid-cols-1 grid-rows-1 rounded-sm ring-offset-2 focus-within:ring-2">
            <span className="sr-only">Current page</span>
            <div className="col-start-1 col-end-1 row-start-1 row-end-1">
              {page}
              {' / '}
              {totalPages}
            </div>
            <select
              onChange={(e) => {
                const newPage = Number(e.target.value);
                const newPageUrl = buildPageUrl(newPage);

                if (newPage !== currentPageNumber) {
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
          <Link
            className={clsx([
              'rounded-sm border border-solid border-neutral-50 p-2 hover:bg-neutral-50 hover:text-gray-950',
              !hasNextPage && 'pointer-events-none opacity-40',
            ])}
            href={buildPageUrl(Number(page) + 1)}
            aria-disabled={!hasNextPage}
          >
            <div className="sr-only">Next page</div>
            <ChevronRight />
          </Link>
        </nav>
      )}
    </>
  );
}
