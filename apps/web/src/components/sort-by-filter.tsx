'use client';

import { MOVIE_SORT_OPTIONS, TV_SORT_OPTIONS } from '@movies/api/discover-options';
import { Label } from '@movies/ui/components/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@movies/ui/components/select';
import { parseAsString, useQueryStates } from 'nuqs';

type SortByFilterProps = {
  mediaType: 'movie' | 'tv';
  controlId?: string;
};

/**
 * Renders a sort-by dropdown filter for ordering movies or TV shows.
 *
 * Allows users to select different sorting criteria for the results.
 * The sort option is applied to URL query parameters.
 *
 * @param mediaType - Whether to show movie or TV sort options.
 */
export default function SortByFilter({
  mediaType,
  controlId = 'select-sort-option',
}: SortByFilterProps) {
  const [urlState, setUrlState] = useQueryStates({
    sort_by: parseAsString,
    page: parseAsString.withDefault('1'),
  });

  const DEFAULT_SORT = 'popularity.desc';
  const sortOptions = mediaType === 'movie' ? MOVIE_SORT_OPTIONS : TV_SORT_OPTIONS;
  const currentSortOption =
    sortOptions.find((option) => option.value === urlState.sort_by) ??
    sortOptions.find((option) => option.value === DEFAULT_SORT);

  function handleSortChange(value: string | null) {
    if (!value) {
      return;
    }

    setUrlState({
      sort_by: value === DEFAULT_SORT ? null : value,
      page: '1', // Reset pagination
    });
  }

  return (
    <div className="min-w-54">
      <Label className="mb-2 text-muted-foreground" htmlFor={controlId}>
        Sort By
      </Label>
      <Select id={controlId} value={currentSortOption?.value} onValueChange={handleSortChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select sort option">{currentSortOption?.label}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
