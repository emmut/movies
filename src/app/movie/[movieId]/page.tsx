import { formatImageUrl } from '@/lib/utils';
import { Movie } from '@/types/Movie';
import Image from 'next/image';
import { env } from 'process';

type MoviePageProps = {
  params: {
    movieId: string;
  };
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

  const movie: Movie = await res.json();
  return movie;
}

export default async function MoviePage({ params }: MoviePageProps) {
  const movieId = parseInt(params.movieId);
  const movie = await getMovieDetails(movieId);

  return (
    <div className="grid max-w-screen-lg gap-4 md:grid-cols-12">
      <Image
        className="col-span-4 w-auto"
        src={formatImageUrl(movie.poster_path, 300)}
        alt={`Poster image of ${movie.title}`}
        width={300}
        height={500}
      />
      <div className="col-span-8 text-sm">
        <h1 className="text-lg font-bold">{movie.title}</h1>
        <h2 className="mt-3 font-semibold uppercase text-zinc-400">Released</h2>
        <p className="mt-1">{movie.release_date}</p>
        <h2 className="mt-3 font-semibold uppercase text-zinc-400">Overview</h2>
        <p className="mt-1">{movie.overview}</p>
      </div>
    </div>
  );
}
