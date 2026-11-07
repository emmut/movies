'use client';

import { useId, useState } from 'react';

import ItemCard from '@/components/item-card';
import { ItemSlider } from '@/components/item-slider';
import { type CreditSort, type PersonTitle, sortPersonTitles } from '@/lib/person-filmography';

type PersonFilmographyProps = {
  title: string;
  titles: PersonTitle[];
  userId?: string;
};

export function PersonFilmography({ title, titles, userId }: PersonFilmographyProps) {
  const [sort, setSort] = useState<CreditSort>('relevance');
  const selectId = useId();
  const sorted = sortPersonTitles(titles, sort);
  if (!sorted.length) return null;

  return (
    <section className="space-y-4" aria-label={title}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">
          {title} ({sorted.length})
        </h2>
        <div className="flex items-center gap-2 text-sm">
          <label htmlFor={selectId} className="text-zinc-400">
            Sort by
          </label>
          <select
            id={selectId}
            aria-label={`Sort ${title}`}
            value={sort}
            onChange={(event) => setSort(event.target.value as CreditSort)}
            className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-white focus-visible:ring-2 focus-visible:ring-white"
          >
            <option value="relevance">Relevance</option>
            <option value="rating">Rating</option>
            <option value="newest">Newest first</option>
          </select>
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
