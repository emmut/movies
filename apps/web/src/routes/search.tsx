import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { authClient } from "@/lib/auth-client";
import { SearchContent } from "@/components/search-content";

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
  const { data: session } = authClient.useSession();
  return <SearchContent userId={session?.user.id} />;
}
