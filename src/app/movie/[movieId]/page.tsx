import { env } from '@/env';
import { formatImageUrl } from '@/lib/utils';
import type { MovieDetails } from '@/types/Movie';
import {
  Calendar,
  ChevronLeft,
  Clock,
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

async function getMovieDetails(movieId: number) {
  const res = await fetch(`https://api.themoviedb.org/3/movie/${movieId}`, {
    headers: {
      authorization: `Bearer ${env.MOVIE_DB_ACCESS_TOKEN}`,
      accept: 'application/json',
    },
    next: {
      revalidate: 60 * 5,
    },
  });

  if (!res.ok) {
    throw new Error('Failed loading movie details');
  }

  const movie: MovieDetails = await res.json();

  return movie;
}

function formatCurrency(amount: number, withSymbol = true) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    currencyDisplay: withSymbol ? 'symbol' : 'code',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatRuntime(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return hours > 0 ? `${hours}h ${remainingMinutes}m` : `${remainingMinutes}m`;
}

export default async function MoviePage(props: MoviePageProps) {
  const params = await props.params;
  const movieId = parseInt(params.movieId);
  const movie = await getMovieDetails(movieId);
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

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-zinc-400 transition-colors hover:text-white"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to home
        </Link>
      </div>

      {/* Hero Section with Backdrop */}
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
                "{tagline}"
              </p>
            )}
          </div>
        </div>
      )}

      {!backdrop_path && (
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold md:text-4xl lg:text-5xl">
            {title}
          </h1>
          {tagline && (
            <p className="text-lg text-zinc-400 italic md:text-xl">
              "{tagline}"
            </p>
          )}
        </div>
      )}

      {/* Main Content */}
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Poster */}
        <div className="lg:col-span-4">
          <Image
            className="mx-auto aspect-2/3 w-full max-w-md rounded-lg shadow-2xl"
            src={formatImageUrl(poster_path, 500)}
            alt={`Poster image of ${title}`}
            width={500}
            height={750}
            priority
          />
        </div>

        {/* Details */}
        <div className="space-y-6 lg:col-span-8">
          {/* Quick Stats */}
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
                {release_date?.split('-')[0]}
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

          {/* Genres */}
          {genres.length > 0 && (
            <div>
              <h2 className="mb-3 text-xl font-semibold">Genres</h2>
              <div className="flex flex-wrap gap-2">
                {genres.map((genre) => (
                  <span
                    key={genre.id}
                    className="rounded-full bg-zinc-800 px-3 py-1 text-sm"
                  >
                    {genre.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Overview */}
          <div>
            <h2 className="mb-3 text-xl font-semibold">Overview</h2>
            <p className="leading-relaxed text-zinc-300">{overview}</p>
          </div>

          {/* Additional Details */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <h3 className="mb-1 text-sm font-semibold text-zinc-400 uppercase">
                  Status
                </h3>
                <p>{status}</p>
              </div>

              <div>
                <h3 className="mb-1 text-sm font-semibold text-zinc-400 uppercase">
                  Original Title
                </h3>
                <p>{original_title}</p>
              </div>

              <div>
                <h3 className="mb-1 text-sm font-semibold text-zinc-400 uppercase">
                  Release Date
                </h3>
                <p>{release_date}</p>
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
                    {formatCurrency(budget)}
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
                    {formatCurrency(revenue - budget)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* External Links */}
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
