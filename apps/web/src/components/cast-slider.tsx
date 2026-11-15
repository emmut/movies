import type { CastMemberSummary } from '@movies/api/tmdb-types/pdp';
import { Skeleton } from '@movies/ui/components/skeleton';
import { Users } from 'lucide-react';

import { BackTargetLink } from '@/components/back-target-link';
import { Imgproxy } from '@/components/image-proxy';
import { ItemSlider } from '@/components/item-slider';

/**
 * Horizontal slider of billed cast, each linking to the person page. Renders
 * nothing when the cast list is empty.
 */
export function CastSlider({ cast }: { cast: CastMemberSummary[] }) {
  if (cast.length === 0) {
    return null;
  }

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">Cast</h2>
      <ItemSlider>
        {cast.map((person) => (
          <BackTargetLink
            key={person.id}
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
            <h3 className="line-clamp-2 text-sm font-medium wrap-anywhere hover:text-white">
              {person.name}
            </h3>
            <p
              className="line-clamp-2 text-xs wrap-anywhere text-zinc-400"
              title={person.character}
            >
              {person.character}
            </p>
            {person.episodeCount !== null && person.episodeCount > 0 && (
              <p className="mt-1 text-xs text-zinc-500">
                {person.episodeCount} {person.episodeCount === 1 ? 'episode' : 'episodes'}
              </p>
            )}
          </BackTargetLink>
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
