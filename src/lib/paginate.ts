/**
 * Slices a fully materialized item set down to one page. Used by the list
 * queries when the stream-provider filter forces in-memory pagination;
 * `currentPage` is clamped to the last page so an out-of-range request still
 * returns content.
 */
export function paginate<T>(items: T[], page: number, itemsPerPage: number) {
  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const currentPage = Math.max(1, Math.min(page, totalPages || 1));
  const offset = (currentPage - 1) * itemsPerPage;

  return {
    pageItems: items.slice(offset, offset + itemsPerPage),
    totalItems,
    totalPages,
    currentPage,
    itemsPerPage,
  };
}
