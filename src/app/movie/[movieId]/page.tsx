import { ExternalLinks } from '@/components/external-links';
import { GoBack } from '@/components/go-back';
import ItemHeader from '@/components/item-header';
import { OtherContent } from '@/components/other-content';
import Pill from '@/components/pill';
import Poster from '@/components/poster';
import { StreamingProviders } from '@/components/streaming-providers';
import { TrailerContent } from '@/components/trailer-content';
import { ItemSlider } from '@/components/ui/item-slider';
import { getUser } from '@/lib/auth-server';
import {
  getMovieCredits,
  getMovieDetails,
  getMovieRecommendations,
  getMovieSimilar,
  getMovieWatchProviders,
} from '@/lib/movies';
import { getUserRegion } from '@/lib/user-actions';
import { formatCurrency, formatImageUrl, formatRuntime } from '@/lib/utils';
import { isResourceInWatchlist } from '@/lib/watchlist';
import { Calendar, Clock, DollarSign, Star, Users } from 'lucide-react';
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
        <Poster poster_path={poster_path} title={title} />

        <div className="space-y-6 lg:col-span-8">
          <ItemHeader
            title={title}
            tagline={tagline}
            itemId={movieId}
            inWatchlist={inWatchlist}
            userId={user?.id}
            resourceType={RESOURCE_TYPE}
          />

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
                  <Link
                    key={director.credit_id}
                    href={`/person/${director.id}`}
                    className="flex items-center gap-3 rounded-lg bg-zinc-800 p-3 transition-colors hover:bg-zinc-700"
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
                    <span className="font-medium hover:text-white">
                      {director.name}
                    </span>
                  </Link>
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
                {credits.cast.map((person) => (
                  <Link
                    key={person.credit_id}
                    href={`/person/${person.id}`}
                    className="w-32 flex-shrink-0 snap-center transition-transform hover:scale-105"
                  >
                    <div className="mb-2 aspect-2/3 overflow-hidden rounded-lg bg-zinc-800">
                      {person.profile_path ? (
                        <Image
                          src={formatImageUrl(person.profile_path, 185)}
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
                    <h3 className="line-clamp-2 text-sm font-medium hover:text-white">
                      {person.name}
                    </h3>
                    <p className="line-clamp-2 text-xs text-zinc-400">
                      {person.character}
                    </p>
                  </Link>
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

          <OtherContent
            id={movieId}
            type="movie"
            getSimilar={(id) => getMovieSimilar(id, userRegion)}
            getRecommendations={(id) => getMovieRecommendations(id, userRegion)}
          />

          <ExternalLinks
            imdbId={movie.imdb_id}
            tmdbId={movieId}
            homepage={homepage}
            mediaType="movie"
          />
        </div>
      </div>
    </div>
  );
}
