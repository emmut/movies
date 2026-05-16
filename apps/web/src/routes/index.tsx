import { ImageProxy } from "@movies/media";
import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/")({
  component: HomeComponent,
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(context.orpc.movies.trending.queryOptions()),
      context.queryClient.ensureQueryData(context.orpc.tv.trending.queryOptions()),
    ]);
  },
});

function HomeComponent() {
  const trendingMovies = useQuery(orpc.movies.trending.queryOptions());
  const trendingTv = useQuery(orpc.tv.trending.queryOptions());

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 p-4">
      <section className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Trending Now</h1>
        <div className="grid gap-4 lg:grid-cols-2">
          <TrendingGrid title="Movies" type="movie" items={trendingMovies.data?.slice(0, 8) ?? []} />
          <TrendingGrid title="TV Shows" type="tv" items={trendingTv.data?.slice(0, 8) ?? []} />
        </div>
      </section>
    </div>
  );
}

type Item = { id: number; title?: string; name?: string; poster_path: string | null };

function TrendingGrid({
  title,
  type,
  items,
}: {
  title: string;
  type: "movie" | "tv";
  items: Item[];
}) {
  return (
    <div>
      <h2 className="mb-2 text-lg font-semibold">{title}</h2>
      <ul className="grid grid-cols-4 gap-2">
        {items.map((item) => (
          <li key={item.id}>
            <Link to={type === "movie" ? "/movie/$movieId" : "/tv/$tvId"} params={type === "movie" ? { movieId: String(item.id) } : { tvId: String(item.id) }}>
              <ImageProxy urls={null} alt={item.title ?? item.name ?? ""} className="aspect-[2/3] w-full rounded" />
              <div className="mt-1 truncate text-sm">{item.title ?? item.name}</div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
