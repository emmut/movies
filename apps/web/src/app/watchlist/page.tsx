import { SystemListPage, SystemListPageProps } from '@/components/system-list-page';

/**
 * Displays the user's watchlist page, allowing filtering between saved movies
 * and TV shows.
 */
export default async function WatchlistPage(props: SystemListPageProps) {
  return <SystemListPage listType="watchlist" searchParams={props.searchParams} />;
}
