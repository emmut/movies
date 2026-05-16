import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/lists")({
  component: ListsRoute,
});

function ListsRoute() {
  const lists = useQuery(orpc.lists.all.queryOptions());
  if (lists.isLoading) return <div className="p-4">Loading…</div>;
  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 p-4">
      <h1 className="text-2xl font-bold">Your Lists</h1>
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {lists.data?.map((list) => (
          <li key={list.id}>
            <Link to="/lists/$id" params={{ id: list.id }} className="block rounded border p-3">
              <div className="font-medium">{list.emoji} {list.name}</div>
              <div className="text-sm text-muted-foreground">{list.itemCount} items</div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
