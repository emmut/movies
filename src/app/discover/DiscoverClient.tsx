'use client';

import MovieCard from '@/components/MovieCard';
import Pill from '@/components/Pill';
import { baseUrl } from '@/lib/config';
import { Genre } from '@/types/Genre';
import { Movie } from '@/types/Movie';
import { useState } from 'react';

type DiscoverProps = {
  defaultMovies: Movie[];
  genres: Genre[];
};

export default function DiscoverClient({
  defaultMovies,
  genres,
}: DiscoverProps) {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [selectedGenre, setSelectedGenre] = useState(0);

  async function handleSelectMovie(genreId: number) {
    setSelectedGenre(genreId);

    const res = await fetch(`${baseUrl}/api/discover?genre=${genreId}`);

    if (res.ok) {
      const movies = await res.json();
      setMovies(movies);
    }
  }

  return (
    <>
      <div className="mt-2 flex max-w-screen-lg flex-wrap gap-2 pt-3">
        {genres.map((genre) => (
          <Pill
            key={genre.id}
            active={genre.id === selectedGenre}
            onClick={() => handleSelectMovie(genre.id)}
          >
            {genre.name}
          </Pill>
        ))}
      </div>

      <div className="mt-8 grid max-w-screen-lg grid-cols-5 gap-4">
        {movies.length === 0
          ? defaultMovies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))
          : movies.map((movie) => <MovieCard key={movie.id} movie={movie} />)}
      </div>
    </>
  );
}
