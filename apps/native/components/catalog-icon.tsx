import {
  CalendarIcon,
  ClockIcon,
  PlayIcon,
  ShoppingCartIcon,
  StarIcon,
  TicketCheckIcon,
  TvIcon,
  UsersIcon,
} from '@native/components/icons';

const icons: Record<string, typeof StarIcon | undefined> = {
  'TMDB Rating': StarIcon,
  Runtime: ClockIcon,
  Seasons: TvIcon,
  Streaming: TvIcon,
  Free: TicketCheckIcon,
  Rent: PlayIcon,
  Buy: ShoppingCartIcon,
  Released: CalendarIcon,
  'First Aired': CalendarIcon,
  Popularity: UsersIcon,
};

export function CatalogIcon({ label, className }: { label: string; className: string }) {
  const Icon = icons[label];
  if (!Icon) {
    return null;
  }
  return <Icon className={'size-5 ' + className} accessible={false} />;
}
