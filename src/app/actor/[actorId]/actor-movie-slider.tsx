import ResourceCard from '@/components/resource-card';
import { ItemSlider } from '@/components/ui/item-slider';
import { ActorMovieCredit } from '@/types/actor';

type ActorMovieSliderProps = {
  movies: ActorMovieCredit[];
};

export default async function ActorMovieSlider({
  movies,
}: ActorMovieSliderProps) {
  const moviesForGrid = movies.map((movie) => ({
    id: movie.id,
    title: movie.title,
    poster_path: movie.poster_path,
    release_date: movie.release_date,
    vote_average: movie.vote_average,
    adult: false,
    backdrop_path: '',
    original_language: '',
    original_title: movie.original_title,
    overview: '',
    media_type: 'movie',
    genre_ids: [],
    popularity: movie.popularity,
    video: false,
    vote_count: 0,
  }));

  return (
    <ItemSlider>
      {moviesForGrid.map((movie) => (
        <ResourceCard
          key={movie.id}
          resource={movie}
          className="w-48"
          type="movie"
        />
      ))}
    </ItemSlider>
  );
}
