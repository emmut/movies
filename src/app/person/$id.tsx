import { createFileRoute } from '@tanstack/react-router';
import { Calendar, MapPin, Star, Users } from 'lucide-react';

import Badge from '@/components/badge';
import { ExternalLinks } from '@/components/external-links';
import { GoBack } from '@/components/go-back';
import { Imgproxy } from '@/components/image-proxy';
import ItemCard from '@/components/item-card';
import { ListButton } from '@/components/list-button';
import { ItemSlider } from '@/components/ui/item-slider';
import { Skeleton } from '@/components/ui/skeleton';
import { getUser } from '@/lib/auth-server';
import { getPersonDetails, getPersonMovieCredits, getPersonTvCredits } from '@/lib/persons';
import { deduplicateAndSortByPopularity } from '@/lib/utils';
import { getRequest } from '@tanstack/react-start/server';

export const Route = createFileRoute('/person/$id')({
  loader: async ({ params }) => {
    const personId = Number(params.id);
    const request = getRequest();
    const referer = request?.headers.get('referer') ?? null;

    const user = await getUser();
    const [person, movieCredits, tvCredits] = await Promise.all([
      getPersonDetails(personId),
      getPersonMovieCredits(personId),
      getPersonTvCredits(personId),
    ]);

    return { personId, referer, user, person, movieCredits, tvCredits };
  },
  pendingComponent: PersonPending,
  component: PersonPage,
});

function PersonPending() {
  return (
    <div className="min-h-screen">
      <div className="mb-6">
        <Skeleton className="h-10 w-24" />
      </div>
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Skeleton className="aspect-2/3 w-full max-w-xs rounded-lg" />
        </div>
        <div className="space-y-6 lg:col-span-8">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PersonPage() {
  const { personId, referer, user, person, movieCredits, tvCredits } = Route.useLoaderData();

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
  } = person;

  const uniqueMovies = deduplicateAndSortByPopularity(
    movieCredits.cast,
    (movie) => movie.release_date,
  );

  const uniqueTvShows = deduplicateAndSortByPopularity(
    tvCredits.cast,
    (show) => show.first_air_date,
  );

  const moviesForGrid = uniqueMovies.map((movie) => ({
    id: movie.id,
    title: movie.title,
    poster_path: movie.poster_path,
    release_date: movie.release_date,
    vote_average: movie.vote_average,
    adult: false,
    backdrop_path: '',
    original_language: '',
    original_title: movie.original_title,
    overview: '',
    media_type: 'movie',
    genre_ids: [],
    popularity: movie.popularity,
    video: false,
    vote_count: 0,
  }));

  const tvShowsForGrid = uniqueTvShows.map((show) => ({
    id: show.id,
    name: show.name,
    original_name: show.original_name,
    poster_path: show.poster_path,
    first_air_date: show.first_air_date,
    vote_average: show.vote_average,
    backdrop_path: '',
    overview: '',
    vote_count: 0,
    genre_ids: [],
    popularity: show.popularity,
    media_type: 'tv',
    origin_country: [],
    original_language: '',
  }));

  const birthYear = birthday ? new Date(birthday).getFullYear() : null;
  const deathYear = deathday ? new Date(deathday).getFullYear() : null;
  const age = birthYear && !deathYear ? new Date().getFullYear() - birthYear : null;

  const totalCredits = uniqueMovies.length + uniqueTvShows.length;

  return (
    <div className="min-h-screen">
      <div className="mb-6">
        <GoBack referer={referer} />
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="lg:col-span-4">
          {profile_path ? (
            <Imgproxy
              className="mx-auto aspect-2/3 w-full max-w-xs rounded-lg border shadow-2xl sm:mx-0"
              src={profile_path}
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
            <h1 className="text-3xl font-bold md:text-4xl lg:text-5xl">{name}</h1>
            <div className="flex w-full items-center justify-between gap-2">
              <Badge variant="blue">Person</Badge>
              {user && (
                <ListButton
                  mediaId={personId}
                  mediaType="person"
                  userId={user.id}
                  showWatchlist={false}
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-lg bg-zinc-900 p-4 text-center">
              <Star className="mx-auto mb-2 h-6 w-6 text-yellow-500" />
              <div className="text-2xl font-bold">{Math.round(person.popularity)}</div>
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
                {age && <div className="text-xs text-zinc-500">({age} years old)</div>}
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
              <p className="leading-relaxed whitespace-pre-line text-zinc-300">{biography}</p>
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <h3 className="mb-1 text-sm font-semibold text-zinc-400 uppercase">Known For</h3>
                <p>{known_for_department || 'Acting'}</p>
              </div>

              {birthday && (
                <div>
                  <h3 className="mb-1 text-sm font-semibold text-zinc-400 uppercase">Birthday</h3>
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
                  <h3 className="mb-1 text-sm font-semibold text-zinc-400 uppercase">Died</h3>
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
              <h2 className="mb-4 text-xl font-semibold">Movies ({uniqueMovies.length})</h2>
              <ItemSlider>
                {moviesForGrid.map((movie) => (
                  <ItemCard
                    key={movie.id}
                    resource={movie}
                    className="w-48"
                    type="movie"
                    userId={user?.id}
                  />
                ))}
              </ItemSlider>
            </div>
          )}

          {uniqueTvShows.length > 0 && (
            <div>
              <h2 className="mb-4 text-xl font-semibold">TV Shows ({uniqueTvShows.length})</h2>
              <ItemSlider>
                {tvShowsForGrid.map((show) => (
                  <ItemCard
                    key={show.id}
                    resource={show}
                    className="w-48"
                    type="tv"
                    userId={user?.id}
                  />
                ))}
              </ItemSlider>
            </div>
          )}

          <ExternalLinks
            tmdbId={personId}
            homepage={homepage}
            imdbId={imdb_id}
            mediaType="person"
          />
        </div>
      </div>
    </div>
  );
}
