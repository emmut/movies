import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { orpc } from "@/utils/orpc";

const paramsSchema = z.object({ id: z.coerce.number().int().positive() });

export const Route = createFileRoute("/person/$id")({
  params: { parse: (raw) => paramsSchema.parse(raw) },
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(
      context.orpc.persons.details.queryOptions({ input: { personId: params.id } }),
    ),
  component: PersonRoute,
});

function PersonRoute() {
  const { id } = Route.useParams();
  const person = useQuery(orpc.persons.details.queryOptions({ input: { personId: id } }));
  if (person.isLoading) return <div className="p-4">Loading…</div>;
  if (!person.data) return <div className="p-4">Not found</div>;
  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 p-4">
      <h1 className="text-2xl font-bold">{person.data.name}</h1>
      <p className="text-muted-foreground">{person.data.biography}</p>
    </div>
  );
}
