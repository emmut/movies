import { Label } from '@movies/ui/components/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@movies/ui/components/select';

type SortByFilterProps = {
  mediaType: 'movie' | 'tv';
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

const MOVIE_SORT_OPTIONS = [
  { value: 'popularity.desc', label: 'Popularity (High to Low)' },
  { value: 'popularity.asc', label: 'Popularity (Low to High)' },
  { value: 'vote_average.desc', label: 'Rating (High to Low)' },
  { value: 'vote_average.asc', label: 'Rating (Low to High)' },
  { value: 'release_date.desc', label: 'Release Date (Newest)' },
  { value: 'release_date.asc', label: 'Release Date (Oldest)' },
  { value: 'revenue.desc', label: 'Revenue (High to Low)' },
  { value: 'revenue.asc', label: 'Revenue (Low to High)' },
  { value: 'original_title.asc', label: 'Title (A-Z)' },
  { value: 'original_title.desc', label: 'Title (Z-A)' },
  { value: 'vote_count.desc', label: 'Most Voted' },
  { value: 'vote_count.asc', label: 'Least Voted' },
];

const TV_SORT_OPTIONS = [
  { value: 'popularity.desc', label: 'Popularity (High to Low)' },
  { value: 'popularity.asc', label: 'Popularity (Low to High)' },
  { value: 'vote_average.desc', label: 'Rating (High to Low)' },
  { value: 'vote_average.asc', label: 'Rating (Low to High)' },
  { value: 'first_air_date.desc', label: 'First Air Date (Newest)' },
  { value: 'first_air_date.asc', label: 'First Air Date (Oldest)' },
];

export default function SortByFilter({ mediaType, value, onChange, className }: SortByFilterProps) {
  const sortOptions = mediaType === 'movie' ? MOVIE_SORT_OPTIONS : TV_SORT_OPTIONS;
  const currentOption =
    sortOptions.find((o) => o.value === value) ??
    sortOptions.find((o) => o.value === 'popularity.desc');

  return (
    <div className={className ?? 'min-w-54'}>
      <Label className="mb-2 text-sm font-medium" htmlFor="select-sort-option">
        Sort By
      </Label>
      <Select
        value={currentOption?.value}
        onValueChange={(v) => v && onChange(v)}
      >
        <SelectTrigger className="w-full" id="select-sort-option">
          <SelectValue>{currentOption?.label}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
