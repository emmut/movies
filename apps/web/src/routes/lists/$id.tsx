import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { authClient } from "@/lib/auth-client";
import { ListDetailsContent } from "@/components/list-details-content";

const listDetailSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
});

export const Route = createFileRoute("/lists/$id")({
  validateSearch: listDetailSchema,
  component: ListDetailRoute,
});

function ListDetailRoute() {
  const { id } = Route.useParams();
  const { data: session } = authClient.useSession();
  return <ListDetailsContent listId={id} userId={session?.user.id} />;
}
