'use client';

import ChevronLeft from '@/icons/ChevronLeft';
import ChevronRight from '@/icons/ChevronRight';
import clsx from 'clsx';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

type PaginationControls = {
  totalPages: number;
  pageType: 'discover' | 'search';
};

function buildPageUrl(
  pageNumber: number,
  currentGenreId: number,
  searchParams: URLSearchParams
) {
  const newSearchParams = new URLSearchParams(searchParams);
  newSearchParams.set('page', String(pageNumber));

  const q = searchParams.get('q');

  if (q !== null) {
    newSearchParams.set('q', q);
  }

  if (currentGenreId !== 0) {
    newSearchParams.set('genreId', String(currentGenreId));
  }

  return `?${newSearchParams.toString()}`;
}

export function PaginationControls({
  totalPages,
  pageType,
}: PaginationControls) {
  const { replace } = useRouter();
  const searchParams = useSearchParams();

  const page = searchParams.get('page') ?? '1';
  const genreIdParam = searchParams.get('genreId');
  const currentGenreId = genreIdParam ? Number(genreIdParam) : 0;

  const currentPageNumber = Number(page);
  const hasPrevPage = currentPageNumber > 1;
  const hasNextPage = currentPageNumber < totalPages;

  function handlePageChange() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  function handleSelectChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const newPage = Number(event.target.value);
    const newPageUrl = buildPageUrl(newPage, currentGenreId, searchParams);

    if (newPage !== currentPageNumber) {
      replace(newPageUrl);
      handlePageChange();
    }
  }

  return (
    <>
      {totalPages > 1 && (
        <nav className="mt-6 mb-3 flex w-full items-center justify-center gap-2">
          {pageType === 'discover' && (
            <Link
              className={clsx([
                'bg-muted/60 hover:bg-muted text-foreground hover:ring-border rounded-sm p-1.5 transition-colors',
                !hasPrevPage && 'pointer-events-none opacity-40',
              ])}
              href={{
                pathname: '/discover',
                query: {
                  page: Number(page) - 1,
                  genreId: currentGenreId,
                },
              }}
              aria-disabled={!hasPrevPage}
              onClick={handlePageChange}
            >
              <div className="sr-only">Previous page</div>
              <ChevronLeft />
            </Link>
          )}

          {pageType === 'search' && (
            <Link
              className={clsx([
                'bg-muted/60 hover:bg-muted text-foreground hover:ring-border rounded-sm p-1.5 transition-colors',
                !hasPrevPage && 'pointer-events-none opacity-40',
              ])}
              href={{
                pathname: '/search',
                query: {
                  page: Number(page) - 1,
                  q: searchParams.get('q'),
                },
              }}
              aria-disabled={!hasPrevPage}
              onClick={handlePageChange}
            >
              <div className="sr-only">Previous page</div>
              <ChevronLeft />
            </Link>
          )}

          <div className="max-w-[min(8rem,100%)] flex-1">
            <label htmlFor="page-select" className="sr-only">
              Current page
            </label>
            <div className="relative">
              <select
                id="page-select"
                value={page}
                onChange={handleSelectChange}
                className="border-input bg-background ring-offset-background focus-visible:ring-ring h-9 w-full appearance-none rounded-md border px-3 pt-1.5 pr-8 pb-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              >
                {Array.from({ length: totalPages }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Sida {i + 1}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                <svg
                  className="text-muted-foreground h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          </div>

          {pageType === 'discover' && (
            <Link
              className={clsx([
                'bg-muted/60 hover:bg-muted text-foreground rounded-sm p-1.5 transition-colors',
                !hasNextPage && 'pointer-events-none opacity-40',
              ])}
              href={{
                pathname: '/discover',
                query: {
                  page: Number(page) + 1,
                  genreId: currentGenreId,
                },
              }}
              aria-disabled={!hasNextPage}
              onClick={handlePageChange}
            >
              <div className="sr-only">Next page</div>
              <ChevronRight />
            </Link>
          )}

          {pageType === 'search' && (
            <Link
              className={clsx([
                'bg-muted/60 hover:bg-muted text-foreground rounded-sm p-1.5 transition-colors',
                !hasNextPage && 'pointer-events-none opacity-40',
              ])}
              href={{
                pathname: '/search',
                query: {
                  page: Number(page) + 1,
                  q: searchParams.get('q'),
                },
              }}
              aria-disabled={!hasNextPage}
              onClick={handlePageChange}
            >
              <div className="sr-only">Next page</div>
              <ChevronRight />
            </Link>
          )}
        </nav>
      )}
    </>
  );
}
