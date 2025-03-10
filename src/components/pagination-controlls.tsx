'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import ChevronLeft from '@/icons/ChevronLeft';
import ChevronRight from '@/icons/ChevronRight';
import clsx from 'clsx';
import Link from 'next/link';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from './ui/select';

type PaginationControls = {
  totalPages: number;
};

function buildPageUrl(
  pageNumber: number,
  currentGenreId: number,
  searchParams: URLSearchParams
) {
  const searchParamsObj: Record<string, string> = {
    page: String(pageNumber),
  };

  const q = searchParams.get('q');
  if (q !== null) {
    searchParamsObj.q = q;
  }

  const newSearchParams = new URLSearchParams(searchParamsObj).toString();
  return currentGenreId !== 0
    ? `${currentGenreId}?${newSearchParams}`
    : `?${newSearchParams}`;
}

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

  function handlePageChange() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  return (
    <>
      {totalPages > 1 && (
        <nav className="mt-6 mb-3 flex w-full items-center justify-center gap-2">
          <Link
            className={clsx([
              'bg-muted/60 hover:bg-muted text-foreground hover:ring-border rounded-sm p-1.5 transition-colors',
              !hasPrevPage && 'pointer-events-none opacity-40',
            ])}
            href={buildPageUrl(Number(page) - 1, currentGenreId, searchParams)}
            aria-disabled={!hasPrevPage}
            onClick={handlePageChange}
          >
            <div className="sr-only">Previous page</div>
            <ChevronLeft />
          </Link>

          <div className="max-w-[min(8rem,100%)] flex-1">
            <span aria-labelledby="page-select" className="sr-only">
              Current page
            </span>
            <Select
              name="page-select"
              onValueChange={(value) => {
                const newPage = Number(value);
                const newPageUrl = buildPageUrl(
                  newPage,
                  currentGenreId,
                  searchParams
                );

                if (newPage !== currentPageNumber) {
                  replace(newPageUrl);
                  handlePageChange();
                }
              }}
            >
              <SelectTrigger className="h-full w-full px-3">
                <SelectValue placeholder={`${page} / ${totalPages}`} />
              </SelectTrigger>
              <SelectContent align="center">
                {Array.from({ length: totalPages }, (_, i) => (
                  <SelectItem key={i + 1} value={String(i + 1)}>
                    {i + 1}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Link
            className={clsx([
              'bg-muted/60 hover:bg-muted text-foreground rounded-sm p-1.5 transition-colors',
              !hasNextPage && 'pointer-events-none opacity-40',
            ])}
            href={buildPageUrl(Number(page) + 1, currentGenreId, searchParams)}
            aria-disabled={!hasNextPage}
            onClick={handlePageChange}
          >
            <div className="sr-only">Next page</div>
            <ChevronRight />
          </Link>
        </nav>
      )}
    </>
  );
}
