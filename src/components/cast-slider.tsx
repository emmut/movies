import Link from 'next/link';
import { Users } from 'lucide-react';

import { Imgproxy } from '@/components/image-proxy';
import { ItemSlider } from '@/components/ui/item-slider';
import { Skeleton } from '@/components/ui/skeleton';

// Structural shape shared by movie `CastMember` and TV `Cast`; kept minimal so
// both credit types satisfy it without coupling this component to either.
type CastSliderMember = {
  credit_id: string;
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
};

/**
 * Horizontal slider of billed cast, each linking to the person page. Renders
 * nothing when the cast list is empty.
 */
export function CastSlider({ cast }: { cast: CastSliderMember[] }) {
  if (cast.length === 0) {
    return null;
  }

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">Cast</h2>
      <ItemSlider>
        {cast.map((person) => (
          <Link
            key={person.credit_id}
            href={`/person/${person.id}`}
            className="w-32 shrink-0 transition-transform hover:scale-105"
          >
            <div className="mb-2 aspect-2/3 overflow-hidden rounded-lg bg-zinc-800">
              {person.profile_path ? (
                <Imgproxy
                  src={person.profile_path}
                  alt={person.name}
                  width={185}
                  height={278}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-zinc-400">
                  <Users className="h-8 w-8" />
                </div>
              )}
            </div>
            <h3 className="line-clamp-2 text-sm font-medium hover:text-white">{person.name}</h3>
            <p className="line-clamp-2 text-xs text-zinc-400">{person.character}</p>
          </Link>
        ))}
      </ItemSlider>
    </div>
  );
}

/** Placeholder shown while a credits-backed section streams in. */
export function CastSliderSkeleton() {
  return (
    <div>
      <Skeleton className="mb-4 h-7 w-40" />
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="w-32 shrink-0">
            <Skeleton className="mb-2 aspect-2/3 w-full rounded-lg" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}
