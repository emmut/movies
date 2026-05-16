import { useQuery } from '@tanstack/react-query';
import { Link, createFileRoute } from '@tanstack/react-router';
import { Calendar, ChevronLeft, Star, Tv, Users } from 'lucide-react';
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

const paramsSchema = z.object({ tvId: z.coerce.number().int().positive() });

export const Route = createFileRoute('/tv/$tvId')({
  params: { parse: (raw) => paramsSchema.parse(raw) },
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(
      context.orpc.tv.details.queryOptions({ input: { tvId: params.tvId } }),
    ),
  component: TvRoute,
});

function TvRoute() {
  const { tvId } = Route.useParams();
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;

  const tv = useQuery(orpc.tv.details.queryOptions({ input: { tvId } }));
  const credits = useQuery(orpc.tv.credits.queryOptions({ input: { tvId } }));
  const watchProviders = useQuery(orpc.tv.watchProviders.queryOptions({ input: { tvId } }));
  const imdbId = useQuery(orpc.tv.imdbId.queryOptions({ input: { tvId } }));
  const watchlistStatus = useQuery(orpc.watchlist.status.queryOptions({ input: { resourceId: tvId, resourceType: 'tv' } }));
  const region = useQuery(orpc.user.region.queryOptions());

  if (tv.isLoading) return <div className="p-4">Loading…</div>;
  if (!tv.data) return <div className="p-4">Not found</div>;

  const {
    name,
    original_name,
    first_air_date,
    last_air_date,
    overview,
    poster_path,
    backdrop_path,
    tagline,
    genres,
    number_of_episodes,
    number_of_seasons,
    episode_run_time,
    spoken_languages,
    status,
    homepage,
    networks,
    created_by,
  } = tv.data;
  const score = Math.ceil(tv.data.vote_average * 10) / 10;

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

      <div className="relative -mx-4 mb-8 h-64 overflow-hidden bg-zinc-900 md:h-80 lg:h-96">
        {backdrop_path && (
          <img
            src={`https://image.tmdb.org/t/p/w1280${backdrop_path}`}
            alt={`Backdrop of ${name}`}
            className="h-full w-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black via-black/60 to-transparent" />
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 lg:grid-cols-12">
        {poster_path && (
          <div className="lg:col-span-4">
            <Poster poster_path={poster_path} title={name} />
          </div>
        )}

        <div className={`space-y-6 ${poster_path ? 'lg:col-span-8' : 'lg:col-span-12'}`}>
          <ItemHeader
            title={name}
            tagline={tagline ?? ''}
            itemId={tvId}
            inWatchlist={watchlistStatus.data ?? false}
            userId={userId}
            resourceType="tv"
          />

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-lg bg-zinc-900 p-4 text-center">
              <Star className="mx-auto mb-2 h-6 w-6 text-yellow-500" />
              <div className="text-2xl font-bold">{score}</div>
              <div className="text-sm text-zinc-400">Rating</div>
              <div className="text-xs text-zinc-500">({tv.data.vote_count} votes)</div>
            </div>

            <div className="flex flex-col items-center justify-center rounded-lg bg-zinc-900 p-4 text-center">
              <Tv className="mx-auto mb-2 h-6 w-6 text-blue-500" />
              <div className="text-2xl font-bold">{number_of_seasons}</div>
              <div className="text-sm text-zinc-400">Seasons</div>
            </div>

            <div className="flex flex-col items-center justify-center rounded-lg bg-zinc-900 p-4 text-center">
              <Calendar className="mx-auto mb-2 h-6 w-6 text-green-500" />
              <div className="text-2xl font-bold">
                {first_air_date ? first_air_date.split('-')[0] : 'N/A'}
              </div>
              <div className="text-sm text-zinc-400">First Aired</div>
            </div>

            <div className="flex flex-col items-center justify-center rounded-lg bg-zinc-900 p-4 text-center">
              <Users className="mx-auto mb-2 h-6 w-6 text-purple-500" />
              <div className="text-2xl font-bold">{Math.round(tv.data.popularity)}</div>
              <div className="text-sm text-zinc-400">Popularity</div>
            </div>
          </div>

          <TrailerContent mediaType="tv" mediaId={tvId} title={name} />

          {genres.length > 0 && (
            <div>
              <h2 className="mb-3 text-xl font-semibold">Genres</h2>
              <div className="flex flex-wrap gap-2">
                {genres.map((genre) => (
                  <Link
                    key={genre.id}
                    to="/discover/$"
                    params={{ _splat: '' }}
                    search={{ mediaType: 'tv', genreId: genre.id, page: 1 }}
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
              {overview || 'No overview available for this TV show.'}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <h3 className="mb-1 text-sm font-semibold text-zinc-400 uppercase">Status</h3>
                <p>{status || 'Unknown'}</p>
              </div>
              {original_name && original_name !== name && (
                <div>
                  <h3 className="mb-1 text-sm font-semibold text-zinc-400 uppercase">Original Name</h3>
                  <p>{original_name}</p>
                </div>
              )}
              <div>
                <h3 className="mb-1 text-sm font-semibold text-zinc-400 uppercase">First Air Date</h3>
                <p>{first_air_date || 'Not available'}</p>
              </div>
              {last_air_date && (
                <div>
                  <h3 className="mb-1 text-sm font-semibold text-zinc-400 uppercase">Last Air Date</h3>
                  <p>{last_air_date}</p>
                </div>
              )}
              {spoken_languages.length > 0 && (
                <div>
                  <h3 className="mb-1 text-sm font-semibold text-zinc-400 uppercase">Languages</h3>
                  <p>{spoken_languages.map((l) => l.english_name).join(', ')}</p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="mb-1 text-sm font-semibold text-zinc-400 uppercase">Episodes</h3>
                <p>{number_of_episodes}</p>
              </div>
              <div>
                <h3 className="mb-1 text-sm font-semibold text-zinc-400 uppercase">Seasons</h3>
                <p>{number_of_seasons}</p>
              </div>
              {episode_run_time.length > 0 && (
                <div>
                  <h3 className="mb-1 text-sm font-semibold text-zinc-400 uppercase">Episode Runtime</h3>
                  <p>{episode_run_time.join(', ')} min</p>
                </div>
              )}
              {networks.length > 0 && (
                <div>
                  <h3 className="mb-1 text-sm font-semibold text-zinc-400 uppercase">Networks</h3>
                  <p>{networks.map((n) => n.name).join(', ')}</p>
                </div>
              )}
            </div>
          </div>

          {created_by.length > 0 && (
            <div>
              <h2 className="mb-4 text-xl font-semibold">Created By</h2>
              <div className="flex flex-wrap gap-4">
                {created_by.map((creator) => (
                  <Link
                    key={creator.credit_id}
                    to="/person/$id"
                    params={{ id: creator.id }}
                    className="flex items-center gap-3 rounded-lg bg-zinc-800 p-3 transition-colors hover:bg-zinc-700"
                  >
                    {creator.profile_path ? (
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full">
                        <img
                          src={`https://image.tmdb.org/t/p/w185${creator.profile_path}`}
                          alt={creator.name}
                          className="h-full w-full object-cover object-center"
                        />
                      </div>
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-700">
                        <Users className="h-5 w-5 text-zinc-400" />
                      </div>
                    )}
                    <span className="font-medium hover:text-white">{creator.name}</span>
                  </Link>
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
                    className="w-32 shrink-0 snap-center transition-transform hover:scale-105"
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
              resourceId={tvId}
              resourceType="tv"
              userRegion={region.data ?? 'US'}
            />
          )}

          <OtherContent id={tvId} type="tv" />

          <ExternalLinks
            imdbId={imdbId.data ?? null}
            tmdbId={tvId}
            homepage={homepage}
            mediaType="tv"
          />
        </div>
      </div>
    </div>
  );
}
