export function FilterCount({ count }: { count: number }) {
  if (count === 0) {
    return null;
  }
  return (
    <span
      data-slot="filter-count"
      aria-hidden="true"
      className="absolute -top-2 -right-2 flex size-5 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground tabular-nums ring-2 ring-background"
    >
      {count}
    </span>
  );
}
