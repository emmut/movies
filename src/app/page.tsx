'use-client';
import Image from 'next/image';

import SectionTitle from '@/components/SectionTitle';
import { Movie } from '@/types/Movies';
import { getMovieDetails, getTrendingMovies } from '@/utils/movies';

export default async function Home() {
  const tredningMovies = await getTrendingMovies();
  const leftTrending = await getMovieDetails(tredningMovies.results[0]);
  const rightTrending = await getMovieDetails(tredningMovies.results[1]);

  return (
    <div className="">
      <SectionTitle>Home</SectionTitle>

      <h3>Trending</h3>

      <div className="grid grid-cols-2">
        <div key={leftTrending.id}>
          <Image
            src={`https://image.tmdb.org/t/p/w500${leftTrending.poster_path}`}
            alt={`Poster of ${leftTrending.title}`}
            width="500"
            height="700"
          />
          <h4>{leftTrending.title}</h4>
        </div>
      </div>
    </div>
  );
}
