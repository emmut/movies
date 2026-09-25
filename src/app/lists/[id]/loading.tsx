import { ListDetailsLoadingSkeleton } from '@/components/list-details-loading';

/**
 * Loading skeleton for the list details page.
 *
 * Displays placeholder UI matching the structure of the list details page:
 * - Header with list title, description, filters, and action buttons
 * - Grid of item cards
 * - Pagination controls
 */
export default function ListDetailsLoading() {
  return <ListDetailsLoadingSkeleton />;
}
