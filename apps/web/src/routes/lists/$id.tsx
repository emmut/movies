import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/lists/$id")({ component: ListDetail });

function ListDetail() {
  const { id } = Route.useParams();
  const data = useQuery(orpc.lists.detail.queryOptions({ input: { listId: id, page: 1 } }));
  if (data.isLoading) return <div className="p-4">Loading…</div>;
  if (!data.data) return <div className="p-4">Not found</div>;
  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 p-4">
      <h1 className="text-2xl font-bold">{data.data.emoji} {data.data.name}</h1>
      <p>{data.data.description}</p>
      <div>{data.data.itemCount} items</div>
    </div>
  );
}
