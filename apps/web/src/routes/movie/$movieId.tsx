import { useQuery } from '@tanstack/react-query';
import { Link, createFileRoute } from '@tanstack/react-router';
import { Calendar, ChevronLeft, Clock, DollarSign, Star, Users } from 'lucide-react';
import { z } from 'zod';

import { authClient } from '@/lib/auth-client';
import ItemHeader from '@/components/item-header';
import Poster from '@/components/poster';
import { StreamingProviders } from '@/components/streaming-providers';
import { TrailerContent } from '@/components/trailer-content';
import { OtherContent } from '@/components/other-content';
import { ExternalLinks } from '@/components/external-links';
import { ItemSlider } from '@movies/ui/components/item-slider';
import Pill from '@movies/ui/components/pill';
import { orpc } from '@/utils/orpc';

const paramsSchema = z.object({ movieId: z.coerce.number().int().positive() });

function formatRuntime(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export const Route = createFileRoute('/movie/$movieId')({
  params: { parse: (raw) => paramsSchema.parse(raw) },
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(
      context.orpc.movies.details.queryOptions({ input: { movieId: params.movieId } }),
    ),
  component: MovieRoute,
});

function MovieRoute() {
  const { movieId } = Route.useParams();
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;

  const movie = useQuery(orpc.movies.details.queryOptions({ input: { movieId } }));
  const credits = useQuery(orpc.movies.credits.queryOptions({ input: { movieId } }));
  const watchProviders = useQuery(orpc.movies.watchProviders.queryOptions({ input: { movieId } }));
  const watchlistStatus = useQuery(orpc.watchlist.status.queryOptions({ input: { resourceId: movieId, resourceType: 'movie' } }));
  const region = useQuery(orpc.user.region.queryOptions());

  if (movie.isLoading) return <div className="p-4">Loading…</div>;
  if (!movie.data) return <div className="p-4">Not found</div>;

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
    imdb_id,
  } = movie.data;
  const score = Math.ceil(movie.data.vote_average * 10) / 10;

  const directors = credits.data?.crew.filter((p) => p.job === 'Director') ?? [];
  const writers = credits.data?.crew.filter((p) =>
    ['Writer', 'Screenplay', 'Story', 'Original Story'].includes(p.job),
  ) ?? [];

  return (
    <div className="min-h-screen">
      <div className="mb-6">
        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-2 text-zinc-400 transition-colors hover:text-white"
        >
          <ChevronLeft className="h-4 w-4" />
          Go back
        </button>
      </div>

      <div className="relative -mx-4 mb-8 h-64 md:h-80 lg:h-96 overflow-hidden bg-zinc-900">
        {backdrop_path && (
          <img
            src={`https://image.tmdb.org/t/p/w1280${backdrop_path}`}
            alt={`Backdrop of ${title}`}
            className="h-full w-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black via-black/60 to-transparent" />
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 lg:grid-cols-12">
        {poster_path && (
          <div className="lg:col-span-4">
            <Poster poster_path={poster_path} title={title} />
          </div>
        )}

        <div className={`space-y-6 ${poster_path ? 'lg:col-span-8' : 'lg:col-span-12'}`}>
          <ItemHeader
            title={title}
            tagline={tagline ?? ''}
            itemId={movieId}
            inWatchlist={watchlistStatus.data ?? false}
            userId={userId}
            resourceType="movie"
          />

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-lg bg-zinc-900 p-4 text-center">
              <Star className="mx-auto mb-2 h-6 w-6 text-yellow-500" />
              <div className="text-2xl font-bold">{score}</div>
              <div className="text-sm text-zinc-400">Rating</div>
              <div className="text-xs text-zinc-500">({movie.data.vote_count} votes)</div>
            </div>

            {runtime > 0 && (
              <div className="flex flex-col items-center justify-center rounded-lg bg-zinc-900 p-4 text-center">
                <Clock className="mx-auto mb-2 h-6 w-6 text-blue-500" />
                <div className="text-2xl font-bold">{formatRuntime(runtime)}</div>
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
              <div className="text-2xl font-bold">{Math.round(movie.data.popularity)}</div>
              <div className="text-sm text-zinc-400">Popularity</div>
            </div>
          </div>

          <TrailerContent mediaType="movie" mediaId={movieId} title={title} />

          {genres.length > 0 && (
            <div>
              <h2 className="mb-3 text-xl font-semibold">Genres</h2>
              <div className="flex flex-wrap gap-2">
                {genres.map((genre) => (
                  <Link
                    key={genre.id}
                    to="/discover/$"
                    params={{ _splat: '' }}
                    search={{ mediaType: 'movie', genreId: genre.id, page: 1 }}
                  >
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
                <h3 className="mb-1 text-sm font-semibold text-zinc-400 uppercase">Status</h3>
                <p>{status || 'Unknown'}</p>
              </div>
              {original_title && (
                <div>
                  <h3 className="mb-1 text-sm font-semibold text-zinc-400 uppercase">Original Title</h3>
                  <p>{original_title}</p>
                </div>
              )}
              <div>
                <h3 className="mb-1 text-sm font-semibold text-zinc-400 uppercase">Release Date</h3>
                <p>{release_date || 'Not available'}</p>
              </div>
              {spoken_languages.length > 0 && (
                <div>
                  <h3 className="mb-1 text-sm font-semibold text-zinc-400 uppercase">Languages</h3>
                  <p>{spoken_languages.map((l) => l.english_name).join(', ')}</p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {budget > 0 && (
                <div>
                  <h3 className="mb-1 text-sm font-semibold text-zinc-400 uppercase">Budget</h3>
                  <p className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    {formatCurrency(budget)}
                  </p>
                </div>
              )}
              {revenue > 0 && (
                <div>
                  <h3 className="mb-1 text-sm font-semibold text-zinc-400 uppercase">Revenue</h3>
                  <p className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    {formatCurrency(revenue)}
                  </p>
                </div>
              )}
              {revenue > 0 && budget > 0 && (
                <div>
                  <h3 className="mb-1 text-sm font-semibold text-zinc-400 uppercase">Profit</h3>
                  <p className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    {formatCurrency(revenue - budget)}
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
                    to="/person/$id"
                    params={{ id: director.id }}
                    className="flex items-center gap-3 rounded-lg bg-zinc-800 p-3 transition-colors hover:bg-zinc-700"
                  >
                    {director.profile_path ? (
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full">
                        <img
                          src={`https://image.tmdb.org/t/p/w185${director.profile_path}`}
                          alt={director.name}
                          className="h-full w-full object-cover object-center"
                        />
                      </div>
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-700">
                        <Users className="h-5 w-5 text-zinc-400" />
                      </div>
                    )}
                    <span className="font-medium hover:text-white">{director.name}</span>
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
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full">
                        <img
                          src={`https://image.tmdb.org/t/p/w185${writer.profile_path}`}
                          alt={writer.name}
                          className="h-full w-full object-cover object-center"
                        />
                      </div>
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-700">
                        <Users className="h-5 w-5 text-zinc-400" />
                      </div>
                    )}
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium">{writer.name}</span>
                      <span className="text-xs text-zinc-400">{writer.job}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(credits.data?.cast.length ?? 0) > 0 && (
            <div>
              <h2 className="mb-4 text-xl font-semibold">Cast</h2>
              <ItemSlider>
                {credits.data!.cast.map((person) => (
                  <Link
                    key={person.credit_id}
                    to="/person/$id"
                    params={{ id: person.id }}
                    className="w-32 shrink-0 transition-transform hover:scale-105"
                  >
                    <div className="mb-2 aspect-2/3 overflow-hidden rounded-lg bg-zinc-800">
                      {person.profile_path ? (
                        <img
                          src={`https://image.tmdb.org/t/p/w185${person.profile_path}`}
                          alt={person.name}
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
          )}

          {watchProviders.data && (
            <StreamingProviders
              watchProviders={watchProviders.data}
              resourceId={movieId}
              resourceType="movie"
              userRegion={region.data ?? 'US'}
            />
          )}

          <OtherContent id={movieId} type="movie" />

          <ExternalLinks
            imdbId={imdb_id}
            tmdbId={movieId}
            homepage={homepage}
            mediaType="movie"
          />
        </div>
      </div>
    </div>
  );
}
