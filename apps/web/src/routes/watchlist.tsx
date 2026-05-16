import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/watchlist")({ component: WatchlistRoute });

function WatchlistRoute() {
  const list = useQuery(orpc.watchlist.list.queryOptions());
  if (list.isLoading) return <div className="p-4">Loading…</div>;
  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 p-4">
      <h1 className="text-2xl font-bold">Watchlist</h1>
      <div>{list.data?.length ?? 0} items</div>
      <ul>
        {list.data?.map((item) => (
          <li key={item.id} className="border-b py-2 text-sm">
            {item.resourceType} #{item.resourceId}
          </li>
        ))}
      </ul>
    </div>
  );
}
