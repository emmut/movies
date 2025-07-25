import { cn, formatImageUrl } from '@/lib/utils';
import { PersonDetails } from '@/types/person';
import { User } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import Badge from './badge';
import { ListButton } from './list-button';
import { RemoveFromListButton } from './remove-from-list-button';

type PersonDetailCardProps = {
  person: PersonDetails;
  className?: string;
  userId?: string;
  showListButton?: boolean;
  listId?: string;
};

/**
 * Displays a detailed card for a person with profile image, name, known for department, and popularity.
 *
 * Similar to PersonCard but specifically designed for persons with detailed data.
 */
export default function PersonDetailCard({
  person,
  className,
  userId,
  showListButton = true,
  listId,
}: PersonDetailCardProps) {
  const href = `/person/${person.id}`;

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
            {person.popularity && (
              <div className="line-clamp-1 text-zinc-400">
                Popularity: {Math.round(person.popularity)}
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
