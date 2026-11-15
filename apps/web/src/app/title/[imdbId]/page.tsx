import 'server-only';
import { imdbIdSchema } from '@movies/api/imdb';
import { cacheLife, cacheTag } from 'next/cache';
import { notFound, redirect } from 'next/navigation';

import { createServerApi } from '@/lib/api-server';
import { CACHE_TAGS } from '@/lib/cache-tags';

async function findTitle(imdbId: string) {
  'use cache: remote';
  cacheLife('hours');
  cacheTag(CACHE_TAGS.public.imdb.title(imdbId));

  const title = await createServerApi(new Headers()).catalog.resolveImdb({ imdbId });
  return title ? `/${title.type}/${title.id}` : null;
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
