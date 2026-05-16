import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { orpc } from "@/utils/orpc";

const searchSchema = z.object({
  mediaType: z.enum(["movie", "tv"]).default("movie"),
  page: z.coerce.number().int().min(1).default(1),
  sort_by: z.string().optional(),
  with_watch_providers: z.string().optional(), // pipe-separated provider IDs
  watch_region: z.string().optional(),
  runtime: z.coerce.number().int().min(0).optional(),
  genreId: z.coerce.number().int().min(0).optional(),
});

export type DiscoverSearch = z.infer<typeof searchSchema>;

export const Route = createFileRoute("/discover/$")({
  validateSearch: searchSchema,
  component: DiscoverRoute,
});

function DiscoverRoute() {
  const { _splat } = Route.useParams() as { _splat?: string };
  const search = Route.useSearch();
  // genreId can come from the splat path segment OR from the search param
  const genreId = Number(_splat ?? 0) || search.genreId || 0;
  const watchProviderIds = search.with_watch_providers
    ?.split("|")
    .map(Number)
    .filter(Boolean) ?? [];

  const data = useQuery(
    orpc.discover.media.queryOptions({
      input: {
        mediaType: search.mediaType,
        genreId,
        page: search.page,
        sortBy: search.sort_by,
      },
    }),
  );

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 p-4">
      <h1 className="text-2xl font-bold">Discover ({search.mediaType})</h1>
      {data.isLoading && <div>Loading…</div>}
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
        {data.data?.results.map((item: any) => (
          <li key={item.id} className="rounded border p-2 text-sm">
            {item.title ?? item.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
