'use client';

import clsx from 'clsx';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from './ui/input';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from './ui/pagination';

type PaginationControls = {
  totalPages: number;
  pageType: 'discover' | 'search' | 'trailers' | 'watchlist' | 'lists';
};

/**
 * Constructs a URL string for the specified page, genre, and page type, preserving relevant query parameters.
 *
 * For 'search' pages, preserves the search query (`q`). For 'trailers' pages, also preserves the `mediaType` parameter if present. The `genreId` parameter is included if `currentGenreId` is not zero.
 *
 * @param pageNumber - The target page number
 * @param currentGenreId - The currently selected genre ID
 * @param searchParams - The current URL search parameters
 * @param pageType - The type of page ('discover', 'search', or 'trailers')
 * @returns A URL string with updated query parameters for the specified page and context
 */
function buildPageUrl(
  pageNumber: number,
  currentGenreId: number,
  searchParams: URLSearchParams,
  pageType: 'discover' | 'search' | 'trailers' | 'watchlist' | 'lists'
) {
  const newSearchParams = new URLSearchParams(searchParams);
  newSearchParams.set('page', String(pageNumber));

  const q = searchParams.get('q');
  const mediaType = searchParams.get('mediaType');

  if (q !== null) {
    newSearchParams.set('q', q);
  }

  if (currentGenreId !== 0) {
    newSearchParams.set('genreId', String(currentGenreId));
  }

  // For trailers and watchlist, preserve mediaType
  if ((pageType === 'trailers' || pageType === 'watchlist') && mediaType) {
    newSearchParams.set('mediaType', mediaType);
  }

  if (pageType === 'lists') {
    return `?${newSearchParams.toString()}`;
  }

  return `${pageType}?${newSearchParams.toString()}`;
}

// Generate page numbers with ellipsis logic (mobile-first)
function generatePageNumbers(currentPage: number, totalPages: number) {
  const pages: (number | 'ellipsis')[] = [];

  // Mobile-first: show fewer pages, enhance for desktop with CSS
  if (totalPages <= 5) {
    // If we have 5 or fewer pages, show all
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    // Always include first page
    pages.push(1);

    if (currentPage <= 3) {
      // Near the beginning: [1] [2] [3] [...] [totalPages]
      for (let i = 2; i <= Math.min(4, totalPages - 1); i++) {
        pages.push(i);
      }
      if (totalPages > 4) {
        pages.push('ellipsis');
        pages.push(totalPages);
      }
    } else if (currentPage >= totalPages - 2) {
      // Near the end: [1] [...] [totalPages-3] [totalPages-2] [totalPages-1] [totalPages]
      if (totalPages > 4) {
        pages.push('ellipsis');
      }
      for (let i = Math.max(2, totalPages - 3); i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // In the middle: [1] [...] [current-2] [current-1] [current] [current+1] [current+2] [...] [totalPages]
      pages.push('ellipsis');
      for (let i = currentPage - 2; i <= currentPage + 2; i++) {
        if (i > 1 && i < totalPages) {
          pages.push(i);
        }
      }
      pages.push('ellipsis');
      pages.push(totalPages);
    }
  }

  return pages;
}

export function PaginationControls({
  totalPages,
  pageType,
}: PaginationControls) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const page = searchParams.get('page') ?? '1';
  const genreIdParam = searchParams.get('genreId');
  const currentGenreId = genreIdParam ? Number(genreIdParam) : 0;

  const currentPageNumber = Number(page);
  const hasPrevPage = currentPageNumber > 1;
  const hasNextPage = currentPageNumber < totalPages;

  function handlePageSelect(pageNumber: number) {
    const container = document.querySelector('#content-container');
    const newPageUrl = buildPageUrl(
      pageNumber,
      currentGenreId,
      searchParams,
      pageType
    );

    router.push(newPageUrl, { scroll: false });

    if (container) {
      container.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    } else {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }
  }

  const pageNumbers = generatePageNumbers(currentPageNumber, totalPages);

  return (
    <>
      {totalPages > 1 && (
        <div className="mt-6 mb-3 flex w-full items-center justify-center">
          <Pagination>
            <PaginationContent className="gap-1 sm:gap-2">
              <PaginationItem>
                <PaginationPrevious
                  onClick={() =>
                    hasPrevPage && handlePageSelect(currentPageNumber - 1)
                  }
                  className={clsx(
                    !hasPrevPage && 'pointer-events-none opacity-40',
                    'h-6 text-xs sm:h-10 sm:px-4 sm:text-sm'
                  )}
                />
              </PaginationItem>

              {pageNumbers.map((pageNumber, index) =>
                pageNumber === 'ellipsis' ? (
                  <PaginationItem key={`ellipsis-${index}`}>
                    <PaginationEllipsis className="h-6 w-6 sm:h-10 sm:w-10" />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink
                      onClick={() => handlePageSelect(pageNumber)}
                      isActive={pageNumber === currentPageNumber}
                      className="h-6 w-6 text-xs sm:h-10 sm:w-10 sm:text-sm"
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}

              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    hasNextPage && handlePageSelect(currentPageNumber + 1)
                  }
                  className={clsx(
                    !hasNextPage && 'pointer-events-none opacity-40',
                    'h-6 text-xs sm:h-10 sm:px-4 sm:text-sm'
                  )}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {totalPages > 20 && (
        <div className="mt-2 flex justify-center px-4">
          <div className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center">
            <span className="text-muted-foreground text-center text-xs sm:text-sm">
              Jump to page:
            </span>
            <div className="flex items-center justify-center gap-2">
              <Input
                type="number"
                min={1}
                max={totalPages}
                placeholder={String(currentPageNumber)}
                className="h-8 w-16 appearance-none text-center text-sm [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const value = Number((e.target as HTMLInputElement).value);
                    if (
                      value >= 1 &&
                      value <= totalPages &&
                      value !== currentPageNumber
                    ) {
                      handlePageSelect(value);
                      (e.target as HTMLInputElement).value = '';
                    }
                  }
                }}
                onBlur={(e) => {
                  const value = Number(e.target.value);
                  if (
                    value >= 1 &&
                    value <= totalPages &&
                    value !== currentPageNumber
                  ) {
                    handlePageSelect(value);
                  }
                  e.target.value = '';
                }}
              />
              <span className="text-muted-foreground text-xs">
                of {totalPages}
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
