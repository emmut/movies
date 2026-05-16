import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/settings")({ component: SettingsRoute });

function SettingsRoute() {
  const queryClient = useQueryClient();
  const region = useQuery(orpc.user.region.queryOptions());
  const updateRegion = useMutation(
    orpc.user.updateRegion.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries({ queryKey: orpc.user.region.key() }),
    }),
  );

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 p-4">
      <h1 className="text-2xl font-bold">Settings</h1>
      <section>
        <h2 className="text-lg font-medium">Region</h2>
        <p>Current: {region.data ?? "…"}</p>
        <select
          className="rounded border bg-background px-2 py-1"
          value={region.data ?? "SE"}
          onChange={(e) => updateRegion.mutate({ region: e.target.value })}
        >
          {["SE", "US", "GB", "DE", "FR", "ES", "IT", "NO", "DK", "FI"].map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </section>
    </div>
  );
}
