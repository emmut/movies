'use client';

import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';

import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Genre } from '@/types/genre';

type GenreFilterClientProps = {
  genres: Genre[];
  mediaType: 'movie' | 'tv';
};

const ALL_GENRES_VALUE = '0';
const ALL_GENRES_LABEL = 'All Genres';

export default function GenreFilterClient({ genres }: GenreFilterClientProps) {
  const [urlState, setUrlState] = useQueryStates({
    genreId: parseAsInteger.withDefault(0),
    page: parseAsString.withDefault('1'),
  });

  const currentValue = String(urlState.genreId ?? 0);
  const currentLabel =
    genres.find((genre) => genre.id === urlState.genreId)?.name ?? ALL_GENRES_LABEL;

  function handleChange(value: string | null) {
    if (value === null) {
      return;
    }

    const nextId = Number(value);

    setUrlState({
      genreId: nextId === 0 ? null : nextId,
      page: '1',
    });
  }

  return (
    <div className="min-w-54">
      <Label className="mb-2 text-sm font-medium" htmlFor="select-genre">
        Genre
      </Label>
      <Select id="select-genre" value={currentValue} onValueChange={handleChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={ALL_GENRES_LABEL}>{currentLabel}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_GENRES_VALUE}>{ALL_GENRES_LABEL}</SelectItem>
          {genres.map((genre) => (
            <SelectItem key={genre.id} value={String(genre.id)}>
              {genre.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
