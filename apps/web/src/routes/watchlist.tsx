import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { authClient } from "@/lib/auth-client";
import { WatchlistContent } from "@/components/watchlist-content";

const watchlistSchema = z.object({
  mediaType: z.enum(["movie", "tv"]).default("movie"),
  page: z.coerce.number().int().min(1).default(1),
});

export const Route = createFileRoute("/watchlist")({
  validateSearch: watchlistSchema,
  component: WatchlistRoute,
});

function WatchlistRoute() {
  const { data: session } = authClient.useSession();
  return <WatchlistContent userId={session?.user.id} />;
}
