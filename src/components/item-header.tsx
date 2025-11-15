import { User } from 'better-auth';
import Badge from './badge';
import { ListButton } from './list-button';
import { WatchlistButton } from './watchlist-button';

type ItemHeaderProps = {
  title: string;
  tagline: string;
  itemId: number;
  inWatchlist: boolean;
  userId?: User['id'];
  resourceType: 'movie' | 'tv';
};

export default function ItemHeader({
  title,
  tagline,
  itemId,
  inWatchlist,
  userId,
  resourceType,
}: ItemHeaderProps) {
  return (
    <div className="flex flex-col items-start gap-3">
      <div className="@container/title w-full">
        <div className="flex flex-col items-start justify-between gap-x-4 gap-y-2 @2xl/title:flex-row">
          <div className="w-full flex-1">
            <h1 className="mb-2 text-3xl font-bold md:text-4xl lg:text-5xl">
              {title}
            </h1>
            {tagline && (
              <p className="mb-4 text-lg text-zinc-400 italic md:text-xl">
                &ldquo;{tagline}&rdquo;
              </p>
            )}
          </div>
          <div className="flex w-full justify-between gap-2 sm:w-max @2xl/title:justify-end">
            <WatchlistButton
              resourceId={itemId}
              resourceType={resourceType}
              isInWatchlist={inWatchlist}
              userId={userId}
            />
            <ListButton
              mediaId={itemId}
              mediaType={resourceType}
              userId={userId}
              showWatchlist={false}
            />
          </div>
        </div>
      </div>
      {resourceType === 'movie' && <Badge variant="yellow">Movie</Badge>}
      {resourceType === 'tv' && <Badge variant="red">TV</Badge>}
    </div>
  );
}
