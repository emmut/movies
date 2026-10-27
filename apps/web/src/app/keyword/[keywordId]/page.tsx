import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import ItemCard from '@/components/item-card';
import { loadKeywordSearchParams } from '@/lib/keyword-search-params';
import { getKeyword, getKeywordTitles } from '@/lib/pdp';
import { keywordRouteSchema } from '@/lib/pdp-route-params';
import { optional } from '@/lib/tmdb';

async function KeywordContent({
  id,
  type,
  page,
}: {
  id: number;
  type: 'movie' | 'tv';
  page: number;
}) {
  const [keyword, titles] = await Promise.all([
    optional(getKeyword(id), null),
    optional(getKeywordTitles(id, type, page), null),
  ]);
  const base = `/keyword/${id}?mediaType=${type}`;
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{keyword?.name ?? 'Theme & Keyword'}</h1>
      <nav className="flex gap-4" aria-label="Media type">
        <Link
          href={`/keyword/${id}?mediaType=movie`}
          aria-current={type === 'movie' ? 'page' : undefined}
        >
          Movies
        </Link>
        <Link
          href={`/keyword/${id}?mediaType=tv`}
          aria-current={type === 'tv' ? 'page' : undefined}
        >
          TV Shows
        </Link>
      </nav>
      {!titles ? (
        <p>Titles are temporarily unavailable. Please try again.</p>
      ) : (
        <>
          {!titles.results.length && <p>No titles found.</p>}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {titles.results.map((item) => (
              <ItemCard key={item.id} resource={item} type={type} />
            ))}
          </div>
          <nav className="flex gap-4" aria-label="Pagination">
            {page > 1 && <Link href={`${base}&page=${page - 1}`}>Previous</Link>}
            {page < Math.min(titles.total_pages, 500) && (
              <Link href={`${base}&page=${page + 1}`}>Next</Link>
            )}
          </nav>
        </>
      )}
    </div>
  );
}

export default async function KeywordPage({
  params,
  searchParams,
}: {
  params: Promise<{ keywordId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ keywordId }, { page, mediaType }] = await Promise.all([
    params,
    loadKeywordSearchParams(searchParams),
  ]);
  const result = keywordRouteSchema.safeParse({ keywordId, page, mediaType });
  if (!result.success) {
    notFound();
  }
  const route = result.data;
  return (
    <Suspense fallback={<p>Loading titles…</p>}>
      <KeywordContent id={route.keywordId} type={route.mediaType} page={route.page} />
    </Suspense>
  );
}
