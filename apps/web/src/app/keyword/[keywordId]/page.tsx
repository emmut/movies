import { notFound, redirect } from 'next/navigation';

import { loadKeywordSearchParams } from '@/lib/keyword-search-params';
import { keywordRouteSchema } from '@/lib/pdp-route-params';

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
  const query = new URLSearchParams({
    keywordId: String(route.keywordId),
    mediaType: route.mediaType,
    page: String(route.page),
  });
  redirect(`/discover?${query}`);
}
