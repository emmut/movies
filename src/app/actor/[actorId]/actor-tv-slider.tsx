import ResourceCard from '@/components/resource-card';
import { ItemSlider } from '@/components/ui/item-slider';
import { ActorTvCredit } from '@/types/actor';

type ActorTvSliderProps = {
  tvShows: ActorTvCredit[];
};

export default async function ActorTvSlider({ tvShows }: ActorTvSliderProps) {
  const tvShowsForGrid = tvShows.map((show) => ({
    id: show.id,
    name: show.name,
    original_name: show.original_name,
    poster_path: show.poster_path,
    first_air_date: show.first_air_date,
    vote_average: show.vote_average,
    backdrop_path: '',
    overview: '',
    vote_count: 0,
    genre_ids: [],
    popularity: show.popularity,
    media_type: 'tv',
    origin_country: [],
    original_language: '',
  }));

  return (
    <ItemSlider>
      {tvShowsForGrid.map((show) => (
        <ResourceCard
          key={show.id}
          resource={show}
          className="w-48"
          type="tv"
        />
      ))}
    </ItemSlider>
  );
}
