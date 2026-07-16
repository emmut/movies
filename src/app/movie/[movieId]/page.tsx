import { Calendar, Clock, Users } from 'lucide-react';
import { headers } from 'next/headers';
import Link from 'next/link';
import { Suspense } from 'react';

import { CastSliderSkeleton } from '@/components/cast-slider';
import { ExternalLinks } from '@/components/external-links';
import { GoBack } from '@/components/go-back';
import { Imgproxy } from '@/components/image-proxy';
import ItemHeader from '@/components/item-header';
import { MovieCredits } from '@/components/movie-credits';
import { MovieFacts } from '@/components/movie-facts';
import { OtherContent } from '@/components/other-content';
import Pill from '@/components/pill';
import Poster from '@/components/poster';
import { RatingsCard } from '@/components/ratings-card';
import { ReviewsSection, ReviewsSectionSkeleton } from '@/components/reviews-section';
import { StreamingSection, StreamingSectionSkeleton } from '@/components/streaming-section';
import { TrailerContent } from '@/components/trailer-content';
import { getUser } from '@/lib/auth-server';
import { formatCertification } from '@/lib/certifications';
import { getImdbRating } from '@/lib/imdb';
import { getMediaCertification } from '@/lib/media-info';
import { getMovieDetails, getMovieRecommendations, getMovieSimilar } from '@/lib/movies';
import { getSystemListMemberships } from '@/lib/system-list-queries';
import { optional } from '@/lib/tmdb';
import { getUserRegion } from '@/lib/user-actions';
import { formatRuntime } from '@/lib/utils';

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

  // Above-the-fold data only: user state plus core movie details, batched so a
  // cold DB connection is paid once. Supporting sections (credits, providers,
  // reviews) fetch inside their own Suspense boundaries below so a slow or
  // failed TMDb endpoint streams in or degrades instead of blocking the shell.
  const [user, userRegion, { inWatchlist, watched }, movie] = await Promise.all([
    getUser(),
    getUserRegion(),
    getSystemListMemberships(movieId, RESOURCE_TYPE),
    getMovieDetails(movieId),
  ]);

  // These depend on results above (region / imdb id), so resolve them together.
  const [certification, imdbRating] = await Promise.all([
    optional(getMediaCertification(RESOURCE_TYPE, movieId, userRegion), null),
    getImdbRating(movie.imdb_id),
  ]);

  const { title, release_date, overview, poster_path, backdrop_path, tagline, genres, runtime, homepage } =
    movie;
  const score = Math.ceil(movie.vote_average * 10) / 10;

  return (
    <div className="min-h-screen">
      <div className="mb-6">
        <GoBack referer={referer} />
      </div>

      {backdrop_path && (
        <div className="relative -mx-4 mb-8 h-64 md:h-80 lg:h-96">
          <Imgproxy
            src={backdrop_path}
            alt={`Backdrop of ${title}`}
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
        <Poster poster_path={poster_path} title={title} />

        <div className="@container space-y-6 lg:col-span-8">
          <ItemHeader
            title={title}
            tagline={tagline}
            itemId={movieId}
            inWatchlist={inWatchlist}
            isWatched={watched}
            userId={user?.id}
            resourceType={RESOURCE_TYPE}
            certification={formatCertification(certification, userRegion)}
          />

          <div className="grid grid-cols-2 gap-4 @3xl:grid-cols-4">
            <RatingsCard score={score} voteCount={movie.vote_count} imdbRating={imdbRating} />

            {runtime > 0 && (
              <div className="rounded-lg bg-zinc-900 p-5">
                <Clock className="mb-3 h-5 w-5 text-blue-500" />
                <div className="text-2xl font-bold">{formatRuntime(runtime)}</div>
                <div className="text-sm text-zinc-400">Runtime</div>
              </div>
            )}

            <div className="rounded-lg bg-zinc-900 p-5">
              <Calendar className="mb-3 h-5 w-5 text-green-500" />
              <div className="text-2xl font-bold">
                {release_date ? release_date.split('-')[0] : 'N/A'}
              </div>
              <div className="text-sm text-zinc-400">Released</div>
            </div>

            <div className="rounded-lg bg-zinc-900 p-5">
              <Users className="mb-3 h-5 w-5 text-purple-500" />
              <div className="text-2xl font-bold">{Math.round(movie.popularity)}</div>
              <div className="text-sm text-zinc-400">Popularity</div>
            </div>
          </div>

          <TrailerContent mediaType="movie" mediaId={movieId} title={title} />

          {genres.length > 0 && (
            <div>
              <h2 className="mb-3 text-xl font-semibold">Genres</h2>
              <div className="flex flex-wrap gap-2">
                {genres.map((genre) => (
                  <Link key={genre.id} href={String(`/discover?genreId=${genre.id}`)}>
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

          <MovieFacts movie={movie} />

          <Suspense fallback={<CastSliderSkeleton />}>
            <MovieCredits movieId={movieId} />
          </Suspense>

          <Suspense fallback={<StreamingSectionSkeleton />}>
            <StreamingSection resourceId={movieId} resourceType="movie" userRegion={userRegion} />
          </Suspense>

          <OtherContent
            id={movieId}
            type="movie"
            userId={user?.id}
            getSimilar={(id) => optional(getMovieSimilar(id, userRegion), [])}
            getRecommendations={(id) => optional(getMovieRecommendations(id, userRegion), [])}
          />

          <Suspense fallback={<ReviewsSectionSkeleton />}>
            <ReviewsSection mediaType="movie" mediaId={movieId} />
          </Suspense>

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
