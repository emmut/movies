export type PageWindow = {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  itemsPerPage: number;
  offset: number;
};

/**
 * Computes the page metadata and row offset for a database-paginated result
 * from its total row count. `currentPage` is clamped to the last page so an
 * out-of-range request still returns content; `offset` is what to pass to the
 * query's `.offset()`.
 */
export function pageWindow(totalItems: number, page: number, itemsPerPage: number): PageWindow {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const currentPage = Math.max(1, Math.min(page, totalPages || 1));
  const offset = (currentPage - 1) * itemsPerPage;

  return { totalItems, totalPages, currentPage, itemsPerPage, offset };
}
