import { cn, formatImageUrl } from '@/lib/utils';
import { PersonDetails, SearchedPerson } from '@/types/person';
import { User } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import Badge from './badge';
import { ListButton } from './list-button';
import { RemoveFromListButton } from './remove-from-list-button';

type PersonCardProps = {
  person: SearchedPerson | PersonDetails;
  className?: string;
  userId?: string;
  showListButton?: boolean;
  listId?: string;
};

/**
 * Displays a card for a person with profile image, name, and known for department.
 *
 * The card links to the person's detail page and shows additional information on hover or focus.
 * If no profile image is available, a fallback with a user icon and "No Photo" text is shown.
 *
 * Can handle both SearchedPerson (from search results) and PersonDetails (from list details).
 */
export default function PersonCard({
  person,
  className,
  userId,
  listId,
  showListButton = true,
}: PersonCardProps) {
  const href = `/person/${person.id}`;

  // Handle both SearchedPerson and PersonDetails
  const knownFor =
    'known_for' in person
      ? person.known_for
          .slice(0, 2)
          .map((item) => item.title || item.name)
          .join(', ')
      : null;

  return (
    <Link
      href={href}
      className={cn(
        'group/person aspect-2/3 w-full flex-shrink-0 overflow-hidden rounded-lg border bg-zinc-900 transition-all duration-300 hover:scale-105 hover:border-blue-400 focus:scale-105 focus:border-blue-400 focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-black focus:outline-none',
        className
      )}
    >
      <div className="relative h-full w-full">
        {person.profile_path ? (
          <Image
            className="object-cover"
            src={formatImageUrl(person.profile_path, 500)}
            alt={`Profile image of ${person.name}`}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-zinc-800">
            <div className="text-center text-zinc-400">
              <div className="mb-2 text-4xl">
                <User className="mx-auto h-12 w-12" />
              </div>
              <div className="text-sm font-semibold">No Photo</div>
            </div>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 transition-opacity group-focus-within/person:opacity-100 group-hover/person:opacity-100 group-focus/person:opacity-100" />

        <div className="absolute right-0 bottom-0 left-0 p-3 text-white opacity-0 transition-opacity group-focus-within/person:opacity-100 group-hover/person:opacity-100 group-focus/person:opacity-100">
          <div className="inset-0 bg-gradient-to-t from-zinc-950/50 via-transparent to-transparent opacity-0 transition-opacity group-focus-within/person:opacity-100 group-hover/person:opacity-100 group-focus/person:opacity-100" />

          <h3 className="mb-1 line-clamp-2 text-sm font-semibold">
            {person.name}
          </h3>
          <div className="text-xs text-zinc-300">
            <div className="mb-1">{person.known_for_department}</div>
            {knownFor && (
              <div className="line-clamp-1 text-zinc-400">
                Known for: {knownFor}
              </div>
            )}
          </div>
        </div>

        <div className="absolute top-2 left-2 opacity-0 transition-opacity group-focus-within/person:opacity-100 group-hover/person:opacity-100 group-focus/person:opacity-100">
          <Badge variant="blue">Person</Badge>
        </div>

        {showListButton && userId && (
          <div className="absolute top-2 right-2 opacity-0 transition-opacity group-focus-within/person:opacity-100 group-hover/person:opacity-100 group-focus/person:opacity-100">
            <ListButton
              mediaId={person.id}
              mediaType="person"
              userId={userId}
            />
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
    </Link>
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
        'group aspect-2/3 w-[150px] flex-shrink-0 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900',
        className
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
