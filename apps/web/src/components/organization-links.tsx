import Link from 'next/link';

export function OrganizationLinks({
  items,
  type,
  kind,
}: {
  items: { id: number; name: string }[];
  kind: 'company' | 'network';
  type: 'movie' | 'tv';
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="min-w-0">
      <h3 className="mb-1 text-sm font-semibold text-zinc-400 uppercase">
        {kind === 'company' ? 'Production Companies' : 'Networks'}
      </h3>
      <p className="text-sm leading-relaxed wrap-anywhere text-zinc-300">
        {items.map((item, index) => (
          <span key={item.id}>
            {index > 0 && ', '}
            <Link
              href={`/discover?${kind}Id=${item.id}&mediaType=${type}`}
              className="rounded-sm underline-offset-4 hover:text-white hover:underline focus-visible:ring-2 focus-visible:ring-blue-400"
            >
              {item.name}
            </Link>
          </span>
        ))}
      </p>
    </div>
  );
}
