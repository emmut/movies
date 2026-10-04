import { SystemListPage, SystemListPageProps } from '@/components/system-list-page';

/**
 * Displays the user's watched history, allowing filtering between watched
 * movies and TV shows.
 */
export default async function WatchedPage(props: SystemListPageProps) {
  return <SystemListPage listType="watched" searchParams={props.searchParams} />;
}
