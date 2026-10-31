'use client';
import { Input } from '@movies/ui/components/input';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@movies/ui/components/pagination';
import { clsx } from 'cn';
import { useRouter, useSearchParams } from 'next/navigation';
import { parseAsInteger, useQueryStates } from 'nuqs';
import { useEffect } from 'react';

import { scheduleScrollToContent, scrollToContentIfScheduled } from '@/lib/scroll-to-content';

type PaginationControlsProps = {
  totalPages: number;
};

// Numbered links are reserved for screens with room for the full range.
function generatePageNumbers(currentPage: number, totalPages: number) {
  const pages: (number | 'ellipsis')[] = [];

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

function PageJump({
  currentPage,
  totalPages,
  onJump,
}: {
  currentPage: number;
  totalPages: number;
  onJump: (page: number) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm whitespace-nowrap text-muted-foreground">
      <span>Page</span>
      <Input
        key={currentPage}
        aria-label="Page number"
        type="number"
        inputMode="numeric"
        min={1}
        max={totalPages}
        defaultValue={currentPage}
        className="h-11 w-16 appearance-none text-center text-base text-foreground sm:h-10 sm:text-sm [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.currentTarget.blur();
          }
          if (event.key === 'Escape') {
            event.currentTarget.value = String(currentPage);
            event.currentTarget.blur();
          }
        }}
        onBlur={(event) => {
          onJump(Number(event.currentTarget.value));
          event.currentTarget.value = String(currentPage);
        }}
      />
      <span>of {totalPages}</span>
    </label>
  );
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
  // after a loading state (e.g. discover's spinner) swapped the controls out
  // during the navigation.
  useEffect(scrollToContentIfScheduled, [currentPageNumber]);

  function buildPageHref(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(page));
    return `?${params.toString()}`;
  }

  function jumpToPage(value: number) {
    if (
      Number.isInteger(value) &&
      value >= 1 &&
      value <= totalPages &&
      value !== currentPageNumber
    ) {
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
            <PaginationContent className="flex-nowrap gap-2">
              <PaginationItem>
                <PaginationPrevious
                  href={buildPageHref(Math.max(1, currentPageNumber - 1))}
                  onNavigate={() => scheduleScrollToContent(buildPageHref(currentPageNumber - 1))}
                  aria-disabled={!hasPrevPage}
                  tabIndex={hasPrevPage ? 0 : -1}
                  className={clsx(
                    !hasPrevPage && 'pointer-events-none opacity-40',
                    'size-11 p-0! text-sm sm:h-10 sm:w-auto sm:px-4!',
                  )}
                />
              </PaginationItem>

              <PaginationItem className="lg:hidden">
                <PageJump
                  currentPage={currentPageNumber}
                  totalPages={totalPages}
                  onJump={jumpToPage}
                />
              </PaginationItem>

              {pageNumbers.map((pageNumber, index) =>
                pageNumber === 'ellipsis' ? (
                  <PaginationItem key={`ellipsis-${index}`} className="hidden lg:block">
                    <PaginationEllipsis className="size-10" />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={pageNumber} className="hidden lg:block">
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
                      className="size-10 text-sm"
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                ),
              )}

              <PaginationItem>
                <PaginationNext
                  href={buildPageHref(Math.min(totalPages, currentPageNumber + 1))}
                  onNavigate={() => scheduleScrollToContent(buildPageHref(currentPageNumber + 1))}
                  aria-disabled={!hasNextPage}
                  tabIndex={hasNextPage ? 0 : -1}
                  className={clsx(
                    !hasNextPage && 'pointer-events-none opacity-40',
                    'size-11 p-0! text-sm sm:h-10 sm:w-auto sm:px-4!',
                  )}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {totalPages > 20 && (
        <div className="mt-2 hidden justify-center px-4 lg:flex">
          <PageJump currentPage={currentPageNumber} totalPages={totalPages} onJump={jumpToPage} />
        </div>
      )}
    </>
  );
}
