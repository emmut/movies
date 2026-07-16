/** Shown when a list query fails (e.g. provider availability lookups). */
export function ListErrorState() {
  return (
    <div className="py-12 text-center">
      <div className="mb-4 text-6xl opacity-50">⚠️</div>
      <h2 className="mb-2 text-xl font-semibold">Couldn&apos;t load this list</h2>
      <p className="text-zinc-400">Something went wrong on our end. Refresh the page to retry.</p>
    </div>
  );
}
