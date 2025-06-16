import { PageHeader } from '@/components/page-header';
import { getLatestTrailers } from '@/lib/api/tmdb';
import { TrailerGrid } from './trailer-grid';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export default async function TrailersPage() {
  const trailers = await getLatestTrailers();

  return (
    <div className="container space-y-8 pb-8">
      <PageHeader
        title="Trailers"
        description="De senaste och mest populära filmtrailerna"
      />
      <TrailerGrid trailers={trailers} />
    </div>
  );
}
