import { cn } from '@movies/ui/lib/utils';
import { useLocation, useNavigate } from '@tanstack/react-router';

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

type PaginationControlsProps = {
  totalPages: number;
  currentPage: number;
};

function generatePageNumbers(currentPage: number, totalPages: number) {
  const pages: (number | 'ellipsis')[] = [];

  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    pages.push(1);

    if (currentPage <= 3) {
      for (let i = 2; i <= Math.min(4, totalPages - 1); i++) {
        pages.push(i);
      }
      if (totalPages > 4) {
        pages.push('ellipsis');
        pages.push(totalPages);
      }
    } else if (currentPage >= totalPages - 2) {
      if (totalPages > 4) {
        pages.push('ellipsis');
      }
      for (let i = Math.max(2, totalPages - 3); i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
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

export function PaginationControls({ totalPages, currentPage }: PaginationControlsProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const hasPrevPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;

  function buildPageHref(page: number) {
    const params = new URLSearchParams(location.search);
    params.set('page', String(page));
    return `${location.pathname}?${params.toString()}`;
  }

  function navigateToPage(page: number) {
    navigate({
      search: (prev: Record<string, unknown>) => ({ ...prev, page }),
    });
  }

  const pageNumbers = generatePageNumbers(currentPage, totalPages);

  return (
    <>
      {totalPages > 1 && (
        <div className="mt-6 mb-3 flex w-full items-center justify-center">
          <Pagination>
            <PaginationContent className="gap-1 sm:gap-2">
              <PaginationItem>
                <PaginationPrevious
                  href={buildPageHref(currentPage - 1)}
                  className={cn(
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
                      isActive={pageNumber === currentPage}
                      className="h-6 w-6 text-xs sm:h-10 sm:w-10 sm:text-sm"
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                ),
              )}

              <PaginationItem>
                <PaginationNext
                  href={buildPageHref(currentPage + 1)}
                  className={cn(
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
                placeholder={String(currentPage)}
                className="h-8 w-16 appearance-none text-center text-sm [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const value = Number((e.target as HTMLInputElement).value);
                    if (value >= 1 && value <= totalPages && value !== currentPage) {
                      navigateToPage(value);
                      (e.target as HTMLInputElement).value = '';
                    }
                  }
                }}
                onBlur={(e) => {
                  const value = Number(e.target.value);
                  if (value >= 1 && value <= totalPages && value !== currentPage) {
                    navigateToPage(value);
                  }
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
