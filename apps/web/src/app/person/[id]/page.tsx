import { Calendar, MapPin, Star, Users } from 'lucide-react';

import Badge from '@/components/badge';
import { ExternalLinks } from '@/components/external-links';
import { GoBack } from '@/components/go-back';
import { Imgproxy } from '@/components/image-proxy';
import ItemCard from '@/components/item-card';
import { ItemSlider } from '@/components/item-slider';
import { PersonFilmography } from '@/components/person-filmography';
import { QuickAddButton } from '@/components/quick-add-button';
import { getUser } from '@/lib/auth-server';
import { getKnownFor, type PersonTitle } from '@/lib/person-filmography';
import { getPersonDetails, getPersonMovieCredits, getPersonTvCredits } from '@/lib/persons';
import { optional } from '@/lib/tmdb';

type PersonPageProps = {
  params: Promise<{
    id: string;
  }>;
};

/**
 * Renders a server-side React page displaying comprehensive details for a specific person, including their biography, filmography, and personal information.
 *
 * @param props - Contains a promise resolving to route parameters with the person ID.
 * @returns The server-rendered React component for the person detail page.
 */
export default async function PersonPage(props: PersonPageProps) {
  const params = await props.params;
  const personId = Number(params.id);

  const user = await getUser();
  const [person, movieCredits, tvCredits] = await Promise.all([
    getPersonDetails(personId),
    // Filmography sliders are supporting sections; a transient TMDb failure
    // should hide them, not fail the page. Details stays uncaught — without it
    // there is no page to render.
    optional(getPersonMovieCredits(personId), { id: personId, cast: [], crew: [] }),
    optional(getPersonTvCredits(personId), { id: personId, cast: [], crew: [] }),
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
  } = person;

  // Convert movies to format expected by ItemCard
  const moviesForGrid: PersonTitle[] = movieCredits.cast.map((movie) => ({
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
    genre_ids: movie.genre_ids ?? [],
    popularity: movie.popularity,
    video: false,
    vote_count: movie.vote_count ?? 0,
    character: movie.character,
    order: movie.order,
  }));

  // Convert TV shows to format expected by ItemCard
  const tvShowsForGrid: PersonTitle[] = tvCredits.cast.map((show) => ({
    id: show.id,
    name: show.name,
    original_name: show.original_name,
    poster_path: show.poster_path,
    first_air_date: show.first_air_date,
    vote_average: show.vote_average,
    backdrop_path: '',
    overview: '',
    vote_count: show.vote_count ?? 0,
    character: show.character,
    episode_count: show.episode_count,
    genre_ids: show.genre_ids ?? [],
    popularity: show.popularity,
    media_type: 'tv',
    origin_country: [],
    original_language: '',
  }));

  const birthYear = birthday ? new Date(birthday).getFullYear() : null;
  const deathYear = deathday ? new Date(deathday).getFullYear() : null;
  const age = birthYear && !deathYear ? new Date().getFullYear() - birthYear : null;

  const totalCredits =
    new Set(moviesForGrid.map((item) => item.id)).size +
    new Set(tvShowsForGrid.map((item) => item.id)).size;
  const knownFor = getKnownFor([...moviesForGrid, ...tvShowsForGrid]);

  return (
    <div className="min-h-screen">
      <div className="mb-6">
        <GoBack />
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="lg:sticky lg:top-[calc(var(--header-height)+(--spacing(8)))] lg:col-span-4 lg:self-start">
          {profile_path ? (
            <div className="max-w-64 lg:max-w-full">
              <Imgproxy
                className="aspect-2/3 w-full rounded-lg border shadow-2xl"
                src={profile_path}
                alt={`Profile image of ${name}`}
                width={500}
                height={750}
                priority
              />
            </div>
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

        <div className="min-w-0 space-y-6 lg:col-span-8">
          <div className="flex flex-col items-start gap-3">
            <h1 className="text-3xl font-bold md:text-4xl lg:text-5xl">{name}</h1>
            <div className="flex w-full items-center justify-between gap-2">
              <Badge variant="blue">Person</Badge>
              {user && (
                <QuickAddButton
                  mediaId={personId}
                  mediaType="person"
                  userId={user.id}
                  showWatchlist={false}
                />
              )}
            </div>
          </div>

          <div className="@container">
            <div className="grid grid-cols-2 gap-4 @3xl:grid-cols-4">
              <div className="rounded-lg bg-zinc-900 p-5">
                <Star className="mb-3 h-5 w-5 text-yellow-500" />
                <div className="text-2xl font-bold">{Math.round(person.popularity)}</div>
                <div className="text-sm text-zinc-400">Popularity</div>
              </div>

              <div className="rounded-lg bg-zinc-900 p-5">
                <Users className="mb-3 h-5 w-5 text-purple-500" />
                <div className="text-2xl font-bold">{totalCredits}</div>
                <div className="text-sm text-zinc-400">Credits</div>
              </div>

              {birthYear && (
                <div className="rounded-lg bg-zinc-900 p-5">
                  <Calendar className="mb-3 h-5 w-5 text-green-500" />
                  <div className="text-2xl font-bold">{birthYear}</div>
                  <div className="text-sm text-zinc-400">Born</div>
                  {age && <div className="text-xs text-zinc-500">({age} years old)</div>}
                </div>
              )}

              {place_of_birth && (
                <div className="rounded-lg bg-zinc-900 p-5">
                  <MapPin className="mb-3 h-5 w-5 text-blue-500" />
                  <div className="text-sm leading-tight font-bold">
                    {place_of_birth.split(', ').slice(-1)[0]}
                  </div>
                  <div className="text-sm text-zinc-400">Origin</div>
                </div>
              )}
            </div>
          </div>

          {knownFor.length > 0 && (
            <section aria-label="Known for">
              <h2 className="mb-2 text-xl font-semibold">Known for</h2>
              <p className="mb-4 text-sm text-zinc-400">Standout movies and TV roles</p>
              <ItemSlider>
                {knownFor.map((item) => (
                  <ItemCard
                    key={`${item.media_type}:${item.id}`}
                    resource={item}
                    className="w-40 sm:w-48"
                    type={'title' in item ? 'movie' : 'tv'}
                    userId={user?.id}
                  />
                ))}
              </ItemSlider>
            </section>
          )}

          {biography && (
            <div>
              <h2 className="mb-3 text-xl font-semibold">Biography</h2>
              <p className="leading-relaxed whitespace-pre-line text-zinc-300">{biography}</p>
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <h3 className="mb-1 text-sm font-semibold text-zinc-400 uppercase">Department</h3>
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

          <PersonFilmography title="Movies" titles={moviesForGrid} userId={user?.id} />
          <PersonFilmography title="TV Shows" titles={tvShowsForGrid} userId={user?.id} />

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
