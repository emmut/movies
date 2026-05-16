import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { orpc } from "@/utils/orpc";

const paramsSchema = z.object({ tvId: z.coerce.number().int().positive() });

export const Route = createFileRoute("/tv/$tvId")({
  params: { parse: (raw) => paramsSchema.parse(raw) },
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(
      context.orpc.tv.details.queryOptions({ input: { tvId: params.tvId } }),
    ),
  component: TvRoute,
});

function TvRoute() {
  const { tvId } = Route.useParams();
  const tv = useQuery(orpc.tv.details.queryOptions({ input: { tvId } }));
  if (tv.isLoading) return <div className="p-4">Loading…</div>;
  if (!tv.data) return <div className="p-4">Not found</div>;
  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 p-4">
      <h1 className="text-2xl font-bold">{tv.data.name}</h1>
      <p className="text-muted-foreground">{tv.data.overview}</p>
    </div>
  );
}
