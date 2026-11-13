import 'server-only';
import { cacheLife } from 'next/cache';
import { notFound, redirect } from 'next/navigation';
import { z } from 'zod';

import { tmdbFetch } from '@/lib/tmdb';

type TitleMatch = { id: number };
type FindResults = { movie_results: TitleMatch[]; tv_results: TitleMatch[] };

const imdbIdSchema = z.string().regex(/^tt\d{7,}$/);

async function findTitle(imdbId: string) {
  'use cache: remote';
  cacheLife('hours');

  const results = await tmdbFetch<FindResults>(`/find/${imdbId}`, {
    searchParams: { external_source: 'imdb_id' },
  });
  const movie = results.movie_results[0];
  if (movie === undefined) {
    const tv = results.tv_results[0];
    return tv === undefined ? null : `/tv/${tv.id}`;
  }
  return `/movie/${movie.id}`;
}

export default async function ImdbTitlePage({ params }: { params: Promise<{ imdbId: string }> }) {
  const imdbId = imdbIdSchema.safeParse((await params).imdbId);
  if (!imdbId.success) {
    notFound();
  }

  const destination = await findTitle(imdbId.data);
  if (!destination) {
    notFound();
  }
  redirect(destination);
}
