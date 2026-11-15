import type { SearchPersonCard } from '@movies/api/search';
import { cn } from 'cn';
import { User } from 'lucide-react';

import { BackTargetLink } from '@/components/back-target-link';
import ClientImage from '@/components/client-image';
import type { ProxyImageUrls } from '@/types/proxy-image';

import Badge from './badge';
import { QuickAddButton } from './quick-add-button';
import { RemoveFromListButton } from './remove-from-list-button';

type PersonCardProps = {
  person: SearchPersonCard;
  className?: string;
  imageUrls?: ProxyImageUrls;
  userId?: string;
  showListButton?: boolean;
  listId?: string;
  /** Load the photo eagerly with high priority — for above-the-fold cards (LCP). */
  eagerImage?: boolean;
};

type PersonArtworkProps = {
  person: SearchPersonCard;
  eager: boolean;
  imageUrls?: ProxyImageUrls;
};

function PersonArtwork({ person, eager, imageUrls }: PersonArtworkProps) {
  if (!person.profileUrl) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-zinc-800">
        <div className="text-center text-zinc-400">
          <div className="mb-2 text-4xl">
            <User className="mx-auto h-12 w-12" />
          </div>
          <div className="text-sm font-semibold">No Photo</div>
        </div>
      </div>
    );
  }

  return (
    <ClientImage
      imageUrls={imageUrls}
      fallbackSrc={person.profileUrl}
      alt={person.name}
      className="h-full w-full object-cover"
      eager={eager}
    />
  );
}

function PersonMetadata({ person }: { person: SearchPersonCard }) {
  const knownFor = person.knownFor.slice(0, 2).join(', ');

  return (
    <div className="absolute right-0 bottom-0 left-0 p-3 text-white opacity-0 transition-opacity group-focus-within/person:opacity-100 group-hover/person:opacity-100 group-focus/person:opacity-100">
      <div className="inset-0 bg-linear-to-t from-zinc-950/50 via-transparent to-transparent opacity-0 transition-opacity group-focus-within/person:opacity-100 group-hover/person:opacity-100 group-focus/person:opacity-100" />

      <h3 className="mb-1 line-clamp-2 text-sm font-semibold">{person.name}</h3>
      <div className="text-xs text-zinc-300">
        <div className="mb-1">{person.department}</div>
        {knownFor && <div className="line-clamp-1 text-zinc-400">Known for: {knownFor}</div>}
      </div>
    </div>
  );
}

/**
 * Displays a card for a person with profile image, name, and known for department.
 *
 * The card links to the person's detail page and shows additional information on hover or focus.
 * If no profile image is available, a fallback with a user icon and "No Photo" text is shown.
 */
export default function PersonCard({
  person,
  imageUrls,
  className,
  userId,
  listId,
  showListButton = true,
  eagerImage = false,
}: PersonCardProps) {
  const href = `/person/${person.id}`;

  return (
    <div
      className={cn(
        'group/person relative aspect-2/3 w-full shrink-0 overflow-hidden rounded-lg border bg-zinc-900 transition-all duration-300 hover:scale-105 hover:border-blue-400 focus:scale-105 focus:border-blue-400 focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-black focus:outline-none',
        className,
      )}
    >
      <BackTargetLink href={href}>
        <div className="relative h-full w-full">
          <PersonArtwork person={person} eager={eagerImage} imageUrls={imageUrls} />
          <div className="absolute inset-0 bg-linear-to-t from-black via-transparent to-transparent opacity-0 transition-opacity group-focus-within/person:opacity-100 group-hover/person:opacity-100 group-focus/person:opacity-100" />

          <PersonMetadata person={person} />

          <div className="absolute top-2 left-2 opacity-0 transition-opacity group-focus-within/person:opacity-100 group-hover/person:opacity-100 group-focus/person:opacity-100">
            <Badge variant="blue">Person</Badge>
          </div>
        </div>
      </BackTargetLink>

      {showListButton && userId && (
        <div className="absolute top-2 right-2 opacity-0 transition-opacity group-focus-within/person:opacity-100 group-hover/person:opacity-100 group-focus/person:opacity-100">
          <QuickAddButton mediaId={person.id} mediaType="person" userId={userId} />
        </div>
      )}

      {listId && (
        <div className="absolute top-2 right-2 opacity-0 transition-opacity group-focus-within/person:opacity-100 group-hover/person:opacity-100 group-focus/person:opacity-100">
          <RemoveFromListButton
            listId={listId}
            mediaId={person.id}
            mediaType="person"
            className="h-8 w-8"
          />
        </div>
      )}
    </div>
  );
}

/**
 * Renders a skeleton placeholder for a person card during loading states.
 *
 * Displays a pulsing card with placeholder blocks that mimic the layout of a person card.
 */
function PersonCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'group aspect-2/3 w-[150px] shrink-0 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900',
        className,
      )}
    >
      <div className="relative h-full">
        <div className="h-full w-full animate-pulse bg-neutral-50/10" />

        <div className="absolute right-0 bottom-0 left-0 p-3 opacity-0">
          <div className="mb-2 h-4 w-3/4 animate-pulse rounded bg-neutral-50/10" />
          <div className="mb-1 h-3 w-1/2 animate-pulse rounded bg-neutral-50/10" />
          <div className="h-3 w-full animate-pulse rounded bg-neutral-50/10" />
        </div>
      </div>
    </div>
  );
}

PersonCard.Skeleton = PersonCardSkeleton;
