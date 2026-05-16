import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { orpc } from "@/utils/orpc";

const paramsSchema = z.object({ movieId: z.coerce.number().int().positive() });

export const Route = createFileRoute("/movie/$movieId")({
  params: { parse: (raw) => paramsSchema.parse(raw) },
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(
      context.orpc.movies.details.queryOptions({ input: { movieId: params.movieId } }),
    ),
  component: MovieRoute,
});

function MovieRoute() {
  const { movieId } = Route.useParams();
  const movie = useQuery(orpc.movies.details.queryOptions({ input: { movieId } }));
  const credits = useQuery(orpc.movies.credits.queryOptions({ input: { movieId } }));

  if (movie.isLoading) return <div className="p-4">Loading…</div>;
  if (!movie.data) return <div className="p-4">Not found</div>;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 p-4">
      <h1 className="text-2xl font-bold">{movie.data.title}</h1>
      <p className="text-muted-foreground">{movie.data.overview}</p>
      <div>Runtime: {movie.data.runtime}m · Released: {movie.data.release_date}</div>
      {credits.data && (
        <div>
          <h2 className="mt-4 text-lg font-semibold">Cast</h2>
          <ul className="text-sm">
            {credits.data.cast.slice(0, 10).map((c) => (
              <li key={c.id}>{c.name} — {c.character}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
