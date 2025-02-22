import { env } from '@/env.mjs';
import Image from 'next/image';
import { formatImageUrl } from '@/lib/utils';
import type { MovieDetails } from '@/types/Movie';

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

export default async function MoviePage(props: MoviePageProps) {
  const params = await props.params;
  const movieId = parseInt(params.movieId);
  const movie = await getMovieDetails(movieId);
  const { title, release_date, overview, poster_path } = movie;
  const score = Math.ceil(movie.vote_average * 10) / 10;

  return (
    <div className="grid max-w-(--breakpoint-lg) grid-cols-12 gap-4">
      <Image
        className="col-span-7 aspect-2/3 rounded-lg md:col-span-4"
        src={formatImageUrl(poster_path, 300)}
        alt={`Poster image of ${title}`}
        width={300}
        height={450}
        priority
      />
      <div className="col-span-full text-sm md:col-span-8">
        <h1 className="text-lg font-bold">{title}</h1>
        <h2 className="mt-3 font-semibold uppercase text-zinc-400">Released</h2>
        <p className="mt-1">{release_date}</p>
        <h2 className="mt-3 font-semibold uppercase text-zinc-400">Overview</h2>
        <p className="mt-1">{overview}</p>
        <h2 className="mt-3 font-semibold uppercase text-zinc-400">
          Vote Score
        </h2>
        <p className="mt-1">
          {score} / 10
          <span className="ml-1 text-xs italic text-zinc-500">
            {movie.vote_count} voters
          </span>
        </p>
        {movie.imdb_id !== null && (
          <>
            <h2 className="mt-3 font-semibold uppercase text-zinc-400">Imdb</h2>
            <a
              className="mt-1 block font-bold underline hover:no-underline"
              href={`https://imdb.com/title/${movie.imdb_id}`}
            >
              Go to IMDB
            </a>
          </>
        )}
      </div>
    </div>
  );
}
