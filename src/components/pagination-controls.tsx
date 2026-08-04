'use client';

import clsx from 'clsx';
import { useRouter, useSearchParams } from 'next/navigation';
import { parseAsInteger, useQueryStates } from 'nuqs';
import { useEffect } from 'react';

import { scheduleScrollToContent, scrollToContentIfScheduled } from '@/lib/scroll-to-content';

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

type PaginationControlsProps = {
  totalPages: number;
};

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

export function PaginationControls({ totalPages }: PaginationControlsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [{ page: currentPageNumber }] = useQueryStates({
    page: parseAsInteger.withDefault(1),
  });

  const hasPrevPage = currentPageNumber > 1;
  const hasNextPage = currentPageNumber < totalPages;

  // A pagination click schedules a scroll to the clicked destination (via the
  // links' onNavigate, which skips modifier/middle clicks that open a new
  // tab); it runs here once the new page is on screen — when this instance
  // re-renders with the new page number, or when a fresh instance mounts
  // after a `<Suspense key={page}>` boundary swapped the tree during the
  // navigation.
  useEffect(scrollToContentIfScheduled, [currentPageNumber]);

  function buildPageHref(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(page));
    return `?${params.toString()}`;
  }

  function jumpToPage(value: number) {
    if (value >= 1 && value <= totalPages && value !== currentPageNumber) {
      const href = buildPageHref(value);
      scheduleScrollToContent(href);
      router.push(href);
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
                  href={buildPageHref(currentPageNumber - 1)}
                  onNavigate={() => scheduleScrollToContent(buildPageHref(currentPageNumber - 1))}
                  className={clsx(
                    !hasPrevPage && 'pointer-events-none opacity-40',
                    'h-6 text-xs sm:h-10 sm:px-4 sm:text-sm',
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
                      href={buildPageHref(pageNumber)}
                      // The active page's link is a no-op navigation; never
                      // schedule a scroll for the page already on screen.
                      onNavigate={
                        pageNumber === currentPageNumber
                          ? undefined
                          : () => scheduleScrollToContent(buildPageHref(pageNumber))
                      }
                      isActive={pageNumber === currentPageNumber}
                      className="h-6 w-6 text-xs sm:h-10 sm:w-10 sm:text-sm"
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                ),
              )}

              <PaginationItem>
                <PaginationNext
                  href={buildPageHref(currentPageNumber + 1)}
                  onNavigate={() => scheduleScrollToContent(buildPageHref(currentPageNumber + 1))}
                  className={clsx(
                    !hasNextPage && 'pointer-events-none opacity-40',
                    'h-6 text-xs sm:h-10 sm:px-4 sm:text-sm',
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
            <span className="text-center text-xs text-muted-foreground sm:text-sm">
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
                    const input = e.target as HTMLInputElement;
                    jumpToPage(Number(input.value));
                    input.value = '';
                  }
                }}
                onBlur={(e) => {
                  jumpToPage(Number(e.target.value));
                  e.target.value = '';
                }}
              />
              <span className="text-xs text-muted-foreground">of {totalPages}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
