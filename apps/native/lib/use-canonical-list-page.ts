import { useRouter } from 'expo-router';
import { useEffect } from 'react';

/** Wait for the requested page before reconciling a server-clamped URL. */
export function useCanonicalListPage(
  query: { data?: { currentPage: number }; isPlaceholderData: boolean },
  page: number,
) {
  const router = useRouter();
  useEffect(() => {
    if (query.data && !query.isPlaceholderData && query.data.currentPage !== page) {
      router.setParams({ page: String(query.data.currentPage) });
    }
  }, [page, query.data, query.isPlaceholderData, router]);
}
