import { Calendar, Tv, Users } from 'lucide-react';
import { headers } from 'next/headers';
import Link from 'next/link';
import { Suspense } from 'react';

import { CastSliderSkeleton } from '@/components/cast-slider';
import { ExternalLinks } from '@/components/external-links';
import { GoBack } from '@/components/go-back';
import { Imgproxy } from '@/components/image-proxy';
import ItemHeader from '@/components/item-header';
import { OtherContent } from '@/components/other-content';
import Pill from '@/components/pill';
import Poster from '@/components/poster';
import { RatingsCard } from '@/components/ratings-card';
import { ReviewsSection, ReviewsSectionSkeleton } from '@/components/reviews-section';
import { StreamingSection, StreamingSectionSkeleton } from '@/components/streaming-section';
import { TrailerContent } from '@/components/trailer-content';
import { TvCast } from '@/components/tv-cast';
import { getUser } from '@/lib/auth-server';
import { formatCertification } from '@/lib/certifications';
import { getImdbRating } from '@/lib/imdb';
import { getMediaCertification } from '@/lib/media-info';
import { getSystemListMemberships } from '@/lib/system-list-queries';
import { optional } from '@/lib/tmdb';
import {
  getTvShowDetails,
  getTvShowImdbId,
  getTvShowRecommendations,
  getTvShowSimilar,
} from '@/lib/tv-shows';
import { getUserRegion } from '@/lib/user-actions';

type TvShowPageProps = {
  params: Promise<{
    tvId: string;
  }>;
};

const RESOURCE_TYPE = 'tv';

/**
 * Displays a comprehensive TV show page with details, cast, creators, streaming providers, and interactive controls.
 *
 * Fetches and presents information about a TV show based on the provided TV show ID, including images, overview, genres, ratings, seasons, episodes, networks, creators, and cast. Shows streaming providers available in the user's region and allows authenticated users to manage their watchlist. Provides external links to TMDB and the official website if available.
 *
 * @param props - Contains a promise resolving to route parameters with the TV show ID.
 */
export default async function TvShowPage(props: TvShowPageProps) {
  const params = await props.params;
  const tvId = Number(params.tvId);
  const headersList = await headers();
  const referer = headersList.get('referer');

  // Above-the-fold data only: user state plus core show details, batched so a
  // cold DB connection is paid once. Supporting sections (cast, providers,
  // reviews) fetch inside their own Suspense boundaries below so a slow or
  // failed TMDb endpoint streams in or degrades instead of blocking the shell.
  const [user, userRegion, { inWatchlist, watched }, tvShow, imdbId] = await Promise.all([
    getUser(),
    getUserRegion(),
    getSystemListMemberships(tvId, RESOURCE_TYPE),
    getTvShowDetails(tvId),
    getTvShowImdbId(tvId),
  ]);

  // These depend on results above (region / imdb id), so resolve them together.
  const [certification, imdbRating] = await Promise.all([
    optional(getMediaCertification(RESOURCE_TYPE, tvId, userRegion), null),
    getImdbRating(imdbId),
  ]);

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

        <div className="@container space-y-6 lg:col-span-8">
          <ItemHeader
            title={name}
            tagline={tagline}
            itemId={tvId}
            inWatchlist={inWatchlist}
            isWatched={watched}
            userId={user?.id}
            resourceType={RESOURCE_TYPE}
            certification={formatCertification(certification, userRegion)}
          />

          <div className="grid grid-cols-2 gap-4 @3xl:grid-cols-4">
            <RatingsCard score={score} voteCount={tvShow.vote_count} imdbRating={imdbRating} />

            <div className="rounded-lg bg-zinc-900 p-5">
              <Tv className="mb-3 h-5 w-5 text-blue-500" />
              <div className="text-2xl font-bold">{number_of_seasons}</div>
              <div className="text-sm text-zinc-400">Seasons</div>
            </div>

            <div className="rounded-lg bg-zinc-900 p-5">
              <Calendar className="mb-3 h-5 w-5 text-green-500" />
              <div className="text-2xl font-bold">
                {first_air_date ? first_air_date.split('-')[0] : 'N/A'}
              </div>
              <div className="text-sm text-zinc-400">First Aired</div>
            </div>

            <div className="rounded-lg bg-zinc-900 p-5">
              <Users className="mb-3 h-5 w-5 text-purple-500" />
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
                  <Link key={genre.id} href={`/discover?genreId=${genre.id}&mediaType=tv`}>
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
                    href={`/person/${creator.id}`}
                    className="flex items-center gap-3 rounded-lg bg-zinc-800 p-3 transition-colors hover:bg-zinc-700"
                  >
                    {creator.profile_path ? (
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full">
                        <Imgproxy
                          src={creator.profile_path}
                          alt={creator.name}
                          width={40}
                          height={40}
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

          <Suspense fallback={<CastSliderSkeleton />}>
            <TvCast tvId={tvId} />
          </Suspense>

          <Suspense fallback={<StreamingSectionSkeleton />}>
            <StreamingSection resourceId={tvId} resourceType="tv" userRegion={userRegion} />
          </Suspense>

          <OtherContent
            id={tvId}
            type="tv"
            userId={user?.id}
            getSimilar={(id) => optional(getTvShowSimilar(id, userRegion), [])}
            getRecommendations={(id) => optional(getTvShowRecommendations(id, userRegion), [])}
          />

          <Suspense fallback={<ReviewsSectionSkeleton />}>
            <ReviewsSection mediaType="tv" mediaId={tvId} />
          </Suspense>

          <ExternalLinks tmdbId={tvId} homepage={homepage} mediaType="tv" imdbId={imdbId} />
        </div>
      </div>
    </div>
  );
}
