import { createFileRoute } from '@tanstack/react-router';
import { Calendar, Star, Tv, Users } from 'lucide-react';

import { ExternalLinks } from '@/components/external-links';
import { GoBack } from '@/components/go-back';
import { Imgproxy } from '@/components/image-proxy';
import ItemHeader from '@/components/item-header';
import { OtherContent } from '@/components/other-content';
import Pill from '@/components/pill';
import Poster from '@/components/poster';
import { Skeleton } from '@/components/ui/skeleton';
import { StreamingProviders } from '@/components/streaming-providers';
import { TrailerContent } from '@/components/trailer-content';
import { ItemSlider } from '@/components/ui/item-slider';
import { getUser } from '@/lib/auth-server';
import {
  getTvShowCredits,
  getTvShowDetails,
  getTvShowImdbId,
  getTvShowRecommendations,
  getTvShowSimilar,
  getTvShowWatchProviders,
} from '@/lib/tv-shows';
import { getUserRegion } from '@/lib/user-actions';
import { isResourceInWatchlist } from '@/lib/watchlist';
import { Link } from '@tanstack/react-router';
import { getRequest } from '@tanstack/react-start/server';

export const Route = createFileRoute('/tv/$tvId')({
  loader: async ({ params }) => {
    const tvId = Number(params.tvId);
    const request = getRequest();
    const referer = request?.headers.get('referer') ?? null;

    const user = await getUser();
    const userRegion = await getUserRegion();
    const inWatchlist = user ? await isResourceInWatchlist(tvId, 'tv') : false;

    const [tvShow, credits, watchProviders, imdbId] = await Promise.all([
      getTvShowDetails(tvId),
      getTvShowCredits(tvId),
      getTvShowWatchProviders(tvId),
      getTvShowImdbId(tvId),
    ]);

    return { tvId, referer, user, userRegion, inWatchlist, tvShow, credits, watchProviders, imdbId };
  },
  pendingComponent: TvPending,
  component: TvShowPage,
});

function TvPending() {
  return (
    <div className="min-h-screen">
      <div className="mb-6">
        <Skeleton className="h-10 w-24" />
      </div>
      <div className="relative -mx-4 mb-8 h-64 md:h-80 lg:h-96">
        <Skeleton className="h-full w-full" />
      </div>
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Poster.Skeleton />
        </div>
        <div className="space-y-6 lg:col-span-8">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-lg bg-zinc-900 p-4 text-center">
                <Skeleton className="mx-auto mb-2 h-6 w-6" />
                <Skeleton className="mx-auto mb-1 h-6 w-12" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TvShowPage() {
  const { tvId, referer, user, userRegion, inWatchlist, tvShow, credits, watchProviders, imdbId } =
    Route.useLoaderData();

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
  } = tvShow;
  const score = Math.ceil(tvShow.vote_average * 10) / 10;

  return (
    <div className="min-h-screen">
      <div className="mb-6">
        <GoBack referer={referer} />
      </div>

      {backdrop_path && (
        <div className="relative -mx-4 mb-8 h-64 md:h-80 lg:h-96">
          <Imgproxy
            src={backdrop_path}
            alt={`Backdrop of ${name}`}
            fill
            width={1280}
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-linear-to-t from-black via-black/60 to-transparent" />
        </div>
      )}

      {!backdrop_path && (
        <div className="relative -mx-4 mb-8 bg-zinc-900 md:h-80 lg:h-96">
          <div className="absolute inset-0 bg-linear-to-t from-black via-black/60 to-transparent" />
        </div>
      )}

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 lg:grid-cols-12">
        <Poster poster_path={poster_path} title={name} />

        <div className="space-y-6 lg:col-span-8">
          <ItemHeader
            title={name}
            tagline={tagline}
            itemId={tvId}
            inWatchlist={inWatchlist}
            userId={user?.id}
            resourceType="tv"
          />

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-lg bg-zinc-900 p-4 text-center">
              <Star className="mx-auto mb-2 h-6 w-6 text-yellow-500" />
              <div className="text-2xl font-bold">{score}</div>
              <div className="text-sm text-zinc-400">Rating</div>
              <div className="text-xs text-zinc-500">({tvShow.vote_count} votes)</div>
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
              <div className="text-2xl font-bold">{Math.round(tvShow.popularity)}</div>
              <div className="text-sm text-zinc-400">Popularity</div>
            </div>
          </div>

          <TrailerContent mediaType="tv" mediaId={tvId} title={name} />

          {genres.length > 0 && (
            <div>
              <h2 className="mb-3 text-xl font-semibold">Genres</h2>
              <div className="flex flex-wrap gap-2">
                {genres.map((genre) => (
                  <Link key={genre.id} to={`/discover?genreId=${genre.id}&mediaType=tv`}>
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
                  <h3 className="mb-1 text-sm font-semibold text-zinc-400 uppercase">
                    Original Name
                  </h3>
                  <p>{original_name}</p>
                </div>
              )}

              <div>
                <h3 className="mb-1 text-sm font-semibold text-zinc-400 uppercase">
                  First Air Date
                </h3>
                <p>{first_air_date || 'Not available'}</p>
              </div>

              {last_air_date && (
                <div>
                  <h3 className="mb-1 text-sm font-semibold text-zinc-400 uppercase">
                    Last Air Date
                  </h3>
                  <p>{last_air_date}</p>
                </div>
              )}

              {spoken_languages.length > 0 && (
                <div>
                  <h3 className="mb-1 text-sm font-semibold text-zinc-400 uppercase">Languages</h3>
                  <p>{spoken_languages.map((lang) => lang.english_name).join(', ')}</p>
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
                  <h3 className="mb-1 text-sm font-semibold text-zinc-400 uppercase">
                    Episode Runtime
                  </h3>
                  <p>{episode_run_time.join(', ')} min</p>
                </div>
              )}

              {networks.length > 0 && (
                <div>
                  <h3 className="mb-1 text-sm font-semibold text-zinc-400 uppercase">Networks</h3>
                  <p>{networks.map((network) => network.name).join(', ')}</p>
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
                    to={`/person/${creator.id}`}
                    className="flex items-center gap-3 rounded-lg bg-zinc-800 p-3 transition-colors hover:bg-zinc-700"
                  >
                    {creator.profile_path ? (
                      <Imgproxy
                        src={creator.profile_path}
                        alt={creator.name}
                        width={92}
                        height={40}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-700">
                        <Users className="h-5 w-5 text-zinc-400" />
                      </div>
                    )}
                    <span className="font-medium hover:text-white">{creator.name}</span>
                  </Link>
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
                    to={`/person/${person.id}`}
                    className="w-32 shrink-0 snap-center transition-transform hover:scale-105"
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
                    <h3 className="line-clamp-2 text-sm font-medium hover:text-white">
                      {person.name}
                    </h3>
                    <p className="line-clamp-2 text-xs text-zinc-400">{person.character}</p>
                  </Link>
                ))}
              </ItemSlider>
            </div>
          )}

          <StreamingProviders
            watchProviders={watchProviders}
            resourceId={tvId}
            resourceType="tv"
            userRegion={userRegion}
          />

          <OtherContent
            id={tvId}
            type="tv"
            getSimilar={(id) => getTvShowSimilar(id, userRegion)}
            getRecommendations={(id) => getTvShowRecommendations(id, userRegion)}
          />

          <ExternalLinks tmdbId={tvId} homepage={homepage} mediaType="tv" imdbId={imdbId} />
        </div>
      </div>
    </div>
  );
}
