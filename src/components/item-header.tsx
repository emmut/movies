import { User } from 'better-auth';

import Badge from './badge';
import { QuickAddButton } from './quick-add-button';
import { SystemListButton } from './system-list-button';

type ItemHeaderProps = {
  title: string;
  tagline: string;
  itemId: number;
  inWatchlist: boolean;
  isWatched: boolean;
  userId?: User['id'];
  resourceType: 'movie' | 'tv';
  certification?: string | null;
};

type HeaderBadgesProps = Pick<ItemHeaderProps, 'resourceType' | 'certification'>;

function HeaderBadges({ resourceType, certification }: HeaderBadgesProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {resourceType === 'movie' && <Badge variant="yellow">Movie</Badge>}
      {resourceType === 'tv' && <Badge variant="red">TV</Badge>}
      {certification && <Badge variant="blue">Rated {certification}</Badge>}
    </div>
  );
}

export default function ItemHeader({
  title,
  tagline,
  itemId,
  inWatchlist,
  isWatched,
  userId,
  resourceType,
  certification,
}: ItemHeaderProps) {
  return (
    <div className="flex flex-col items-start gap-3">
      <div className="@container/title w-full">
        <div className="flex flex-col items-start justify-between gap-x-4 gap-y-2 @2xl/title:flex-row">
          <div className="w-full flex-1">
            <h1 className="mb-2 text-3xl font-bold md:text-4xl lg:text-5xl">{title}</h1>
            {tagline && (
              <p className="mb-4 text-lg text-zinc-400 italic md:text-xl">
                &ldquo;{tagline}&rdquo;
              </p>
            )}
          </div>
          <div className="flex w-full justify-between gap-2 sm:w-max @2xl/title:justify-end">
            <SystemListButton
              listType="watchlist"
              resourceId={itemId}
              resourceType={resourceType}
              isActive={inWatchlist}
              userId={userId}
            />
            <SystemListButton
              listType="watched"
              resourceId={itemId}
              resourceType={resourceType}
              isActive={isWatched}
              userId={userId}
              className="mr-auto"
            />
            <QuickAddButton
              mediaId={itemId}
              mediaType={resourceType}
              userId={userId}
              showWatchlist={false}
            />
          </div>
        </div>
      </div>
      <HeaderBadges resourceType={resourceType} certification={certification} />
    </div>
  );
}
