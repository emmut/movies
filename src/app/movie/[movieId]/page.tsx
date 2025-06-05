import { GoBack } from '@/components/go-back';
import Pill from '@/components/pill';
import { StreamingProviders } from '@/components/streaming-providers';
import { ItemSlider } from '@/components/ui/item-slider';
import {
  getMovieCredits,
  getMovieDetails,
  getMovieWatchProviders,
} from '@/lib/movies';
import { formatCurrency, formatImageUrl, formatRuntime } from '@/lib/utils';
import {
  Calendar,
  Clock,
  Database,
  DollarSign,
  Globe,
  Star,
  Users,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
type MoviePageProps = {
  params: Promise<{
    movieId: string;
  }>;
};

export default async function MoviePage(props: MoviePageProps) {
  const params = await props.params;
  const movieId = parseInt(params.movieId);

  // Fetch data in parallel
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

  // Get main cast (first 8 actors)
  const mainCast = credits.cast.slice(0, 8);

  return (
    <div className="min-h-screen">
      <div className="mb-6">
        <GoBack />
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
          <div className="absolute right-4 bottom-4 left-4">
            <h1 className="mb-2 text-3xl font-bold text-white md:text-4xl lg:text-5xl">
              {title}
            </h1>
            {tagline && (
              <p className="text-lg text-zinc-200 italic md:text-xl">
                &ldquo;{tagline}&rdquo;
              </p>
            )}
          </div>
        </div>
      )}

      {!backdrop_path && (
        <div className="relative -mx-4 mb-8 bg-zinc-900 md:h-80 lg:h-96">
          <div className="absolute inset-0 z-10 p-8">
            <h1 className="mb-2 text-3xl font-bold text-neutral-100 md:text-4xl lg:text-5xl">
              {title}
            </h1>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
        </div>
      )}

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="lg:col-span-4">
          {poster_path ? (
            <Image
              className="mx-auto aspect-2/3 w-full max-w-md rounded-lg shadow-2xl"
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
              <div className="rounded-lg bg-zinc-900 p-4 text-center">
                <Clock className="mx-auto mb-2 h-6 w-6 text-blue-500" />
                <div className="text-2xl font-bold">
                  {formatRuntime(runtime)}
                </div>
                <div className="text-sm text-zinc-400">Runtime</div>
              </div>
            )}

            <div className="rounded-lg bg-zinc-900 p-4 text-center">
              <Calendar className="mx-auto mb-2 h-6 w-6 text-green-500" />
              <div className="text-2xl font-bold">
                {release_date ? release_date.split('-')[0] : 'N/A'}
              </div>
              <div className="text-sm text-zinc-400">Released</div>
            </div>

            <div className="rounded-lg bg-zinc-900 p-4 text-center">
              <Users className="mx-auto mb-2 h-6 w-6 text-purple-500" />
              <div className="text-2xl font-bold">
                {Math.round(movie.popularity)}
              </div>
              <div className="text-sm text-zinc-400">Popularity</div>
            </div>
          </div>

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

          {mainCast.length > 0 && (
            <div>
              <h2 className="mb-4 text-xl font-semibold">Skådespelare</h2>
              <ItemSlider>
                {mainCast.map((actor) => (
                  <div
                    key={actor.id}
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
            movieId={movieId}
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
