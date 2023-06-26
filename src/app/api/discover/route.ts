import { MovieResponse } from '@/types/Movie';
import { NextResponse } from 'next/server';
import { env } from 'process';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const genre = searchParams.get('genre');

  let url = `https://api.themoviedb.org/3/discover/movie?sort_by=polularity.desc&region=SE&include_adult=false&include_video=false`;

  if (genre !== null) {
    url += `&with_genres=${genre}`;
  }

  const res = await fetch(url, {
    headers: {
      authorization: `Bearer ${env.MOVIE_DB_ACCESS_TOKEN}`,
    },
    next: {
      revalidate: 60 * 60 * 5,
    },
  });

  if (!res.ok) {
    throw new Error('Error loading discover movies');
  }

  const movies: MovieResponse = await res.json();
  return NextResponse.json(movies.results);
}
