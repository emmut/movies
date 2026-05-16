import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { orpc } from "@/utils/orpc";

const searchSchema = z.object({
  q: z.string().optional().default(""),
  page: z.coerce.number().int().min(1).default(1),
  mediaType: z.enum(["movie", "tv", "person", "multi"]).default("multi"),
});

export const Route = createFileRoute("/search")({
  validateSearch: searchSchema,
  component: SearchRoute,
});

function SearchRoute() {
  const { q, page, mediaType } = Route.useSearch();
  const enabled = q.length > 0;

  const multi = useQuery({
    ...orpc.search.multi.queryOptions({ input: { query: q, page } }),
    enabled: enabled && mediaType === "multi",
  });
  const movies = useQuery({
    ...orpc.search.movies.queryOptions({ input: { query: q, page } }),
    enabled: enabled && mediaType === "movie",
  });
  const tv = useQuery({
    ...orpc.search.tv.queryOptions({ input: { query: q, page } }),
    enabled: enabled && mediaType === "tv",
  });
  const persons = useQuery({
    ...orpc.search.persons.queryOptions({ input: { query: q, page } }),
    enabled: enabled && mediaType === "person",
  });

  const active = mediaType === "movie" ? movies : mediaType === "tv" ? tv : mediaType === "person" ? persons : multi;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 p-4">
      <h1 className="text-2xl font-bold">Search</h1>
      {!enabled && <p>Type a query…</p>}
      {active.isLoading && <div>Loading…</div>}
      <pre className="text-xs">{JSON.stringify(active.data, null, 2).slice(0, 2000)}</pre>
    </div>
  );
}
