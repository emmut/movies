import Badge from '@/components/badge';
import { GoBack } from '@/components/go-back';
import Pill from '@/components/pill';
import { StreamingProviders } from '@/components/streaming-providers';
import { TrailerContent } from '@/components/trailer-content';
import { ItemSlider } from '@/components/ui/item-slider';
import { WatchlistButton } from '@/components/watchlist-button';
import { getUser } from '@/lib/auth-server';
import {
  getMovieCredits,
  getMovieDetails,
  getMovieWatchProviders,
} from '@/lib/movies';
import { getUserRegion } from '@/lib/user-actions';
import { formatCurrency, formatImageUrl, formatRuntime } from '@/lib/utils';
import { isResourceInWatchlist } from '@/lib/watchlist';
import {
  Calendar,
  Clock,
  Database,
  DollarSign,
  Globe,
  Star,
  Users,
} from 'lucide-react';
import { headers } from 'next/headers';
import Image from 'next/image';
import Link from 'next/link';

type MoviePageProps = {
  params: Promise<{
    movieId: string;
  }>;
};

const RESOURCE_TYPE = 'movie';

/**
 * Renders a server-side React page displaying comprehensive details for a specific movie, including its information, cast, crew, genres, statistics, streaming providers, and external links.
 *
 * @param props - Contains a promise resolving to route parameters with the movie ID.
 * @returns The server-rendered React component for the movie detail page.
 *
 * @remarks If a user is logged in, the page displays a watchlist button reflecting the user's watchlist status for the movie.
 */
export default async function MoviePage(props: MoviePageProps) {
  const params = await props.params;
  const movieId = Number(params.movieId);
  const headersList = await headers();
  const referer = headersList.get('referer');

  const user = await getUser();
  const userRegion = await getUserRegion();
  const inWatchlist = user
    ? await isResourceInWatchlist(movieId, RESOURCE_TYPE)
    : false;

  const [movie, credits, watchProviders] = await Promise.all([
    getMovieDetails(movieId),
    getMovieCredits(movieId),
    getMovieWatchProviders(movieId),
  ]);

  const {
    title,
    release_date,
    overview,
    poster_path,
    backdrop_path,
    tagline,
    genres,
    runtime,
    budget,
    revenue,
    spoken_languages,
    status,
    homepage,
    original_title,
  } = movie;
  const score = Math.ceil(movie.vote_average * 10) / 10;

  const directors = credits.crew.filter((person) => person.job === 'Director');
  const writers = credits.crew.filter(
    (person) =>
      person.job === 'Writer' ||
      person.job === 'Screenplay' ||
      person.job === 'Story' ||
      person.job === 'Original Story'
  );

  return (
    <div className="min-h-screen">
      <div className="mb-6">
        <GoBack referer={referer} />
      </div>

      {backdrop_path && (
        <div className="relative -mx-4 mb-8 h-64 md:h-80 lg:h-96">
          <Image
            src={formatImageUrl(backdrop_path, 1280)}
            alt={`Backdrop of ${title}`}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
        </div>
      )}

      {!backdrop_path && (
        <div className="relative -mx-4 mb-8 bg-zinc-900 md:h-80 lg:h-96">
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
        </div>
      )}

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="lg:col-span-4">
          {poster_path ? (
            <Image
              className="mx-auto aspect-2/3 w-full max-w-md rounded-lg border shadow-2xl"
              src={formatImageUrl(poster_path, 500)}
              alt={`Poster image of ${title}`}
              width={500}
              height={750}
              priority
            />
          ) : (
            <div className="mx-auto flex aspect-2/3 w-full max-w-md items-center justify-center rounded-lg bg-zinc-800 shadow-2xl">
              <div className="text-center text-zinc-400">
                <div className="mb-4 text-6xl">🎬</div>
                <div className="text-lg font-semibold">No Poster</div>
                <div className="text-sm">Available</div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6 lg:col-span-8">
          <div className="flex flex-col items-start gap-3">
            <div className="@container/title w-full">
              <div className="flex flex-col items-start justify-between gap-x-4 gap-y-2 @2xl/title:flex-row">
                <div className="w-full flex-1">
                  <h1 className="mb-2 text-3xl font-bold md:text-4xl lg:text-5xl">
                    {title}
                  </h1>
                  {tagline && (
                    <p className="mb-4 text-lg text-zinc-400 italic md:text-xl">
                      &ldquo;{tagline}&rdquo;
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <WatchlistButton
                    resourceId={movieId}
                    resourceType={RESOURCE_TYPE}
                    isInWatchlist={inWatchlist}
                    userId={user?.id}
                  />
                </div>
              </div>
            </div>
            <Badge variant="yellow">Movie</Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-lg bg-zinc-900 p-4 text-center">
              <Star className="mx-auto mb-2 h-6 w-6 text-yellow-500" />
              <div className="text-2xl font-bold">{score}</div>
              <div className="text-sm text-zinc-400">Rating</div>
              <div className="text-xs text-zinc-500">
                ({movie.vote_count} votes)
              </div>
            </div>

            {runtime > 0 && (
              <div className="flex flex-col items-center justify-center rounded-lg bg-zinc-900 p-4 text-center">
                <Clock className="mx-auto mb-2 h-6 w-6 text-blue-500" />
                <div className="text-2xl font-bold">
                  {formatRuntime(runtime)}
                </div>
                <div className="text-sm text-zinc-400">Runtime</div>
              </div>
            )}

            <div className="flex flex-col items-center justify-center rounded-lg bg-zinc-900 p-4 text-center">
              <Calendar className="mx-auto mb-2 h-6 w-6 text-green-500" />
              <div className="text-2xl font-bold">
                {release_date ? release_date.split('-')[0] : 'N/A'}
              </div>
              <div className="text-sm text-zinc-400">Released</div>
            </div>

            <div className="flex flex-col items-center justify-center rounded-lg bg-zinc-900 p-4 text-center">
              <Users className="mx-auto mb-2 h-6 w-6 text-purple-500" />
              <div className="text-2xl font-bold">
                {Math.round(movie.popularity)}
              </div>
              <div className="text-sm text-zinc-400">Popularity</div>
            </div>
          </div>

          <TrailerContent mediaType="movie" mediaId={movieId} title={title} />

          {genres.length > 0 && (
            <div>
              <h2 className="mb-3 text-xl font-semibold">Genres</h2>
              <div className="flex flex-wrap gap-2">
                {genres.map((genre) => (
                  <Link key={genre.id} href={`/discover?genreId=${genre.id}`}>
                    <Pill>{genre.name}</Pill>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div>
            <h2 className="mb-3 text-xl font-semibold">Overview</h2>
            <p className="leading-relaxed text-zinc-300">
              {overview || 'No overview available for this movie.'}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <h3 className="mb-1 text-sm font-semibold text-zinc-400 uppercase">
                  Status
                </h3>
                <p>{status || 'Unknown'}</p>
              </div>

              {original_title && (
                <div>
                  <h3 className="mb-1 text-sm font-semibold text-zinc-400 uppercase">
                    Original Title
                  </h3>
                  <p>{original_title}</p>
                </div>
              )}

              <div>
                <h3 className="mb-1 text-sm font-semibold text-zinc-400 uppercase">
                  Release Date
                </h3>
                <p>{release_date || 'Not available'}</p>
              </div>

              {spoken_languages.length > 0 && (
                <div>
                  <h3 className="mb-1 text-sm font-semibold text-zinc-400 uppercase">
                    Languages
                  </h3>
                  <p>
                    {spoken_languages
                      .map((lang) => lang.english_name)
                      .join(', ')}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {budget > 0 && (
                <div>
                  <h3 className="mb-1 text-sm font-semibold text-zinc-400 uppercase">
                    Budget
                  </h3>
                  <p className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    {formatCurrency(budget, false)}
                  </p>
                </div>
              )}

              {revenue > 0 && (
                <div>
                  <h3 className="mb-1 text-sm font-semibold text-zinc-400 uppercase">
                    Revenue
                  </h3>
                  <p className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    {formatCurrency(revenue, false)}
                  </p>
                </div>
              )}

              {revenue > 0 && budget > 0 && (
                <div>
                  <h3 className="mb-1 text-sm font-semibold text-zinc-400 uppercase">
                    Profit
                  </h3>
                  <p className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    {formatCurrency(revenue - budget, false)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {directors.length > 0 && (
            <div>
              <h2 className="mb-4 text-xl font-semibold">Directors</h2>
              <div className="flex flex-wrap gap-4">
                {directors.map((director) => (
                  <div
                    key={director.credit_id}
                    className="flex items-center gap-3 rounded-lg bg-zinc-800 p-3"
                  >
                    {director.profile_path ? (
                      <Image
                        src={formatImageUrl(director.profile_path, 185)}
                        alt={director.name}
                        width={40}
                        height={40}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-700">
                        <Users className="h-5 w-5 text-zinc-400" />
                      </div>
                    )}
                    <span className="font-medium">{director.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {writers.length > 0 && (
            <div>
              <h2 className="mb-4 text-xl font-semibold">Writers</h2>
              <div className="flex flex-wrap gap-4">
                {writers.map((writer) => (
                  <div
                    key={writer.credit_id}
                    className="flex items-center gap-3 rounded-lg bg-zinc-800 p-3"
                  >
                    {writer.profile_path ? (
                      <Image
                        src={formatImageUrl(writer.profile_path, 185)}
                        alt={writer.name}
                        width={40}
                        height={40}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-700">
                        <Users className="h-5 w-5 text-zinc-400" />
                      </div>
                    )}
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium">{writer.name}</span>
                      <span className="text-xs text-zinc-400">
                        {writer.job}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {credits.cast.length > 0 && (
            <div>
              <h2 className="mb-4 text-xl font-semibold">Cast</h2>
              <ItemSlider>
                {credits.cast.map((actor) => (
                  <div
                    key={actor.credit_id}
                    className="w-32 flex-shrink-0 snap-center"
                  >
                    <div className="mb-2 aspect-2/3 overflow-hidden rounded-lg bg-zinc-800">
                      {actor.profile_path ? (
                        <Image
                          src={formatImageUrl(actor.profile_path, 185)}
                          alt={actor.name}
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
                    <h3 className="line-clamp-2 text-sm font-medium">
                      {actor.name}
                    </h3>
                    <p className="line-clamp-2 text-xs text-zinc-400">
                      {actor.character}
                    </p>
                  </div>
                ))}
              </ItemSlider>
            </div>
          )}

          <StreamingProviders
            watchProviders={watchProviders}
            resourceId={movieId}
            resourceType="movie"
            userRegion={userRegion}
          />

          <div className="flex flex-wrap gap-4">
            {movie.imdb_id && (
              <a
                className="inline-flex items-center gap-2 rounded-lg bg-yellow-600 px-4 py-2 font-semibold text-black transition-colors hover:bg-yellow-700"
                href={`https://imdb.com/title/${movie.imdb_id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                IMDb
              </a>
            )}

            <a
              className="inline-flex items-center gap-2 rounded-lg bg-zinc-700 px-4 py-2 font-semibold text-white transition-colors hover:bg-zinc-600"
              href={`https://www.themoviedb.org/movie/${movieId}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Database className="h-4 w-4" />
              TMDB
            </a>

            {homepage && (
              <a
                className="inline-flex items-center gap-2 rounded-lg bg-zinc-700 px-4 py-2 font-semibold text-white transition-colors hover:bg-zinc-600"
                href={homepage}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Globe className="h-4 w-4" />
                Official Website
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
