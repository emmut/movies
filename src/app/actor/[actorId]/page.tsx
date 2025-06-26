import Badge from '@/components/badge';
import { GoBack } from '@/components/go-back';
import {
  getActorDetails,
  getActorMovieCredits,
  getActorTvCredits,
} from '@/lib/actors';
import { formatImageUrl } from '@/lib/utils';
import { Calendar, MapPin, Star, Users } from 'lucide-react';
import { headers } from 'next/headers';
import Image from 'next/image';
import { Suspense } from 'react';
import ActorMovieSlider from './actor-movie-slider';
import ActorTvSlider from './actor-tv-slider';
import SliderSkeleton from './slider-skeleton';

type ActorPageProps = {
  params: Promise<{
    actorId: string;
  }>;
};

/**
 * Renders a server-side React page displaying comprehensive details for a specific actor, including their biography, filmography, and personal information.
 *
 * @param props - Contains a promise resolving to route parameters with the actor ID.
 * @returns The server-rendered React component for the actor detail page.
 */
export default async function ActorPage(props: ActorPageProps) {
  const params = await props.params;
  const actorId = Number(params.actorId);
  const headersList = await headers();
  const referer = headersList.get('referer');

  const [actor, movieCredits, tvCredits] = await Promise.all([
    getActorDetails(actorId),
    getActorMovieCredits(actorId),
    getActorTvCredits(actorId),
  ]);

  const {
    name,
    biography,
    birthday,
    deathday,
    place_of_birth,
    profile_path,
    known_for_department,
    also_known_as,
    homepage,
    imdb_id,
  } = actor;

  // Sort movies by popularity and release date, remove duplicates
  const uniqueMovies = movieCredits.cast
    .filter(
      (movie, index, self) => index === self.findIndex((m) => m.id === movie.id)
    )
    .sort((a, b) => {
      // Sort by popularity first, then by release date
      if (b.popularity !== a.popularity) {
        return b.popularity - a.popularity;
      }
      return (
        new Date(b.release_date || '1900-01-01').getTime() -
        new Date(a.release_date || '1900-01-01').getTime()
      );
    });

  // Sort TV shows by popularity and first air date, remove duplicates
  const uniqueTvShows = tvCredits.cast
    .filter(
      (show, index, self) => index === self.findIndex((s) => s.id === show.id)
    )
    .sort((a, b) => {
      // Sort by popularity first, then by first air date
      if (b.popularity !== a.popularity) {
        return b.popularity - a.popularity;
      }
      return (
        new Date(b.first_air_date || '1900-01-01').getTime() -
        new Date(a.first_air_date || '1900-01-01').getTime()
      );
    });

  const birthYear = birthday ? new Date(birthday).getFullYear() : null;
  const deathYear = deathday ? new Date(deathday).getFullYear() : null;
  const age =
    birthYear && !deathYear ? new Date().getFullYear() - birthYear : null;

  const totalCredits = uniqueMovies.length + uniqueTvShows.length;

  return (
    <div className="min-h-screen">
      <div className="mb-6">
        <GoBack referer={referer} />
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="lg:col-span-4">
          {profile_path ? (
            <Image
              className="mx-auto aspect-2/3 w-full max-w-md rounded-lg border shadow-2xl"
              src={formatImageUrl(profile_path, 500)}
              alt={`Profile image of ${name}`}
              width={500}
              height={750}
              priority
            />
          ) : (
            <div className="mx-auto flex aspect-2/3 w-full max-w-md items-center justify-center rounded-lg bg-zinc-800 shadow-2xl">
              <div className="text-center text-zinc-400">
                <div className="mb-4 text-6xl">👤</div>
                <div className="text-lg font-semibold">No Photo</div>
                <div className="text-sm">Available</div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6 lg:col-span-8">
          <div className="flex flex-col items-start gap-3">
            <h1 className="text-3xl font-bold md:text-4xl lg:text-5xl">
              {name}
            </h1>
            <Badge variant="blue">Actor</Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-lg bg-zinc-900 p-4 text-center">
              <Star className="mx-auto mb-2 h-6 w-6 text-yellow-500" />
              <div className="text-2xl font-bold">
                {Math.round(actor.popularity)}
              </div>
              <div className="text-sm text-zinc-400">Popularity</div>
            </div>

            <div className="flex flex-col items-center justify-center rounded-lg bg-zinc-900 p-4 text-center">
              <Users className="mx-auto mb-2 h-6 w-6 text-purple-500" />
              <div className="text-2xl font-bold">{totalCredits}</div>
              <div className="text-sm text-zinc-400">Credits</div>
            </div>

            {birthYear && (
              <div className="flex flex-col items-center justify-center rounded-lg bg-zinc-900 p-4 text-center">
                <Calendar className="mx-auto mb-2 h-6 w-6 text-green-500" />
                <div className="text-2xl font-bold">{birthYear}</div>
                <div className="text-sm text-zinc-400">Born</div>
                {age && (
                  <div className="text-xs text-zinc-500">({age} years old)</div>
                )}
              </div>
            )}

            {place_of_birth && (
              <div className="flex flex-col items-center justify-center rounded-lg bg-zinc-900 p-4 text-center">
                <MapPin className="mx-auto mb-2 h-6 w-6 text-blue-500" />
                <div className="text-center text-sm leading-tight font-bold">
                  {place_of_birth.split(', ').slice(-1)[0]}
                </div>
                <div className="text-sm text-zinc-400">Origin</div>
              </div>
            )}
          </div>

          {biography && (
            <div>
              <h2 className="mb-3 text-xl font-semibold">Biography</h2>
              <p className="leading-relaxed whitespace-pre-line text-zinc-300">
                {biography}
              </p>
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <h3 className="mb-1 text-sm font-semibold text-zinc-400 uppercase">
                  Known For
                </h3>
                <p>{known_for_department || 'Acting'}</p>
              </div>

              {birthday && (
                <div>
                  <h3 className="mb-1 text-sm font-semibold text-zinc-400 uppercase">
                    Birthday
                  </h3>
                  <p>{birthday}</p>
                </div>
              )}

              {place_of_birth && (
                <div>
                  <h3 className="mb-1 text-sm font-semibold text-zinc-400 uppercase">
                    Place of Birth
                  </h3>
                  <p>{place_of_birth}</p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {deathday && (
                <div>
                  <h3 className="mb-1 text-sm font-semibold text-zinc-400 uppercase">
                    Died
                  </h3>
                  <p>{deathday}</p>
                </div>
              )}

              {also_known_as.length > 0 && (
                <div>
                  <h3 className="mb-1 text-sm font-semibold text-zinc-400 uppercase">
                    Also Known As
                  </h3>
                  <p>{also_known_as.slice(0, 3).join(', ')}</p>
                </div>
              )}
            </div>
          </div>

          {uniqueMovies.length > 0 && (
            <div>
              <h2 className="mb-4 text-xl font-semibold">
                Movies ({uniqueMovies.length})
              </h2>
              <Suspense fallback={<SliderSkeleton />}>
                <ActorMovieSlider movies={uniqueMovies} />
              </Suspense>
            </div>
          )}

          {uniqueTvShows.length > 0 && (
            <div>
              <h2 className="mb-4 text-xl font-semibold">
                TV Shows ({uniqueTvShows.length})
              </h2>
              <Suspense fallback={<SliderSkeleton />}>
                <ActorTvSlider tvShows={uniqueTvShows} />
              </Suspense>
            </div>
          )}

          <div className="flex flex-wrap gap-4">
            {imdb_id && (
              <a
                className="inline-flex items-center gap-2 rounded-lg bg-yellow-600 px-4 py-2 font-semibold text-black transition-colors hover:bg-yellow-700"
                href={`https://imdb.com/name/${imdb_id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                IMDb
              </a>
            )}

            <a
              className="inline-flex items-center gap-2 rounded-lg bg-zinc-700 px-4 py-2 font-semibold text-white transition-colors hover:bg-zinc-600"
              href={`https://www.themoviedb.org/person/${actorId}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Users className="h-4 w-4" />
              TMDB
            </a>

            {homepage && (
              <a
                className="inline-flex items-center gap-2 rounded-lg bg-zinc-700 px-4 py-2 font-semibold text-white transition-colors hover:bg-zinc-600"
                href={homepage}
                target="_blank"
                rel="noopener noreferrer"
              >
                Official Website
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
