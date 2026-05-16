import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { authClient } from '@/lib/auth-client';
import { AvailableGenresNavigation } from '@/components/available-genre-navigation';
import { DiscoverContent } from '@/components/discover-content';
import { orpc } from '@/utils/orpc';

const searchSchema = z.object({
  mediaType: z.enum(['movie', 'tv']).default('movie'),
  page: z.coerce.number().int().min(1).default(1),
  sort_by: z.string().optional(),
  with_watch_providers: z.string().optional(),
  watch_region: z.string().optional(),
  runtime: z.coerce.number().int().min(0).optional(),
  genreId: z.coerce.number().int().min(0).optional(),
});

export type DiscoverSearch = z.infer<typeof searchSchema>;

export const Route = createFileRoute('/discover/$')({
  validateSearch: searchSchema,
  component: DiscoverRoute,
});

function DiscoverRoute() {
  const { data: session } = authClient.useSession();
  const region = useQuery(orpc.user.region.queryOptions());
  const userProviderIds = useQuery(orpc.user.userWatchProviders.queryOptions());
  const allProviders = useQuery(
    orpc.user.allWatchProviders.queryOptions({ input: { region: region.data } }),
  );

  const filteredWatchProviders = (allProviders.data ?? []).filter((p) =>
    (userProviderIds.data ?? []).includes(p.provider_id),
  );

  return (
    <DiscoverContent
      filteredWatchProviders={filteredWatchProviders}
      userRegion={region.data ?? 'US'}
      genreNavigation={<AvailableGenresNavigation />}
      userId={session?.user?.id}
    />
  );
}
