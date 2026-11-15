type QueryState = { isPending: boolean; error: Error | null; refetch: () => Promise<unknown> };
type CombinedQueryState = {
  error: Error | null;
  pending: boolean;
  ready: boolean;
  retry: () => void;
};

/** A failed dependency wins over a pending one, so its retry remains available. */
export function combineQueryStates(queries: QueryState[]): CombinedQueryState {
  const error = queries.find((query) => query.error)?.error ?? null;
  const pending = !error && queries.some((query) => query.isPending);
  function retry() {
    for (const query of queries) {
      void query.refetch();
    }
  }
  const ready = queries.every((query) => !query.isPending && !query.error);
  return { error, pending, ready, retry };
}
