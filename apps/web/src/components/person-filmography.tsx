'use client';

import { Label } from '@movies/ui/components/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@movies/ui/components/select';
import { ArrowDownWideNarrow } from 'lucide-react';
import { useId, useState } from 'react';

import ItemCard from '@/components/item-card';
import { ItemSlider } from '@/components/item-slider';
import { type CreditSort, type PersonTitle, sortPersonTitles } from '@/lib/person-filmography';

type PersonFilmographyProps = {
  title: string;
  titles: PersonTitle[];
  userId?: string;
};

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Most relevant' },
  { value: 'rating', label: 'Highest rated' },
  { value: 'newest', label: 'Newest first' },
] satisfies { value: CreditSort; label: string }[];

export function PersonFilmography({ title, titles, userId }: PersonFilmographyProps) {
  const [sort, setSort] = useState<CreditSort>('relevance');
  const selectId = useId();
  const sorted = sortPersonTitles(titles, sort);
  if (!sorted.length) {
    return null;
  }

  return (
    <section className="space-y-4" aria-label={title}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">
          {title} ({sorted.length})
        </h2>
        <div className="flex items-center gap-2 text-sm">
          <Label htmlFor={selectId} className="sr-only">
            Sort {title}
          </Label>
          <Select<CreditSort>
            id={selectId}
            items={SORT_OPTIONS}
            value={sort}
            onValueChange={(value) => {
              if (value) {
                setSort(value);
              }
            }}
          >
            <SelectTrigger className="w-44 data-[size=default]:h-10">
              <ArrowDownWideNarrow className="size-4 text-muted-foreground" aria-hidden="true" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end" alignItemWithTrigger={false}>
              <SelectGroup>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>
      <ItemSlider key={sort}>
        {sorted.map((item) => (
          <ItemCard
            key={`${item.media_type}:${item.id}`}
            resource={item}
            className="w-40 sm:w-48"
            type={'title' in item ? 'movie' : 'tv'}
            userId={userId}
          />
        ))}
      </ItemSlider>
    </section>
  );
}
