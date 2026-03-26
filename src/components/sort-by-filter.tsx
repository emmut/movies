'use client';

import { parseAsString, useQueryStates } from 'nuqs';

import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type SortByFilterProps = {
  mediaType: 'movie' | 'tv';
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

/**
 * Renders a sort-by dropdown filter for ordering movies or TV shows.
 *
 * Allows users to select different sorting criteria for the results.
 * The sort option is applied to URL query parameters.
 *
 * @param mediaType - Whether to show movie or TV sort options.
 */
export default function SortByFilter({ mediaType }: SortByFilterProps) {
  const [urlState, setUrlState] = useQueryStates({
    sort_by: parseAsString,
    page: parseAsString.withDefault('1'),
  });

  const sortOptions = mediaType === 'movie' ? MOVIE_SORT_OPTIONS : TV_SORT_OPTIONS;
  const defaultSort = 'popularity.desc';
  const currentSort = urlState.sort_by || defaultSort;

  const handleSortChange = (value: string | null) => {
    if (!value) return;
    setUrlState({
      sort_by: value === defaultSort ? null : value,
      page: '1', // Reset pagination
    });
  };

  return (
    <div className="">
      <Label className="mb-2 text-sm font-medium">Sort By</Label>
      <Select value={currentSort} onValueChange={handleSortChange}>
        <SelectTrigger className="w-full min-w-54">
          <SelectValue placeholder="Select sort option">
            {sortOptions.find((o) => o.value === currentSort)?.label}
          </SelectValue>
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
