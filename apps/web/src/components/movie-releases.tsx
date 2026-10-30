import { getPdpExtras } from '@/lib/pdp';
import { getRegionalReleases } from '@/lib/pdp-extra-content';
import { optional } from '@/lib/tmdb';

export async function MovieReleases({ movieId, region }: { movieId: number; region: string }) {
  const extras = await optional(getPdpExtras('movie', movieId), null);
  const dates = getRegionalReleases(extras?.release_dates, region);
  if (dates.length === 0) {
    return null;
  }
  return (
    <section className="border-t border-white/10 pt-8">
      <h2 className="mb-5 text-xl font-semibold tracking-tight">Release Dates · {region}</h2>
      <ul className="divide-y divide-white/5 rounded-xl border border-white/10 bg-zinc-900/30 px-5">
        {dates.map((release) => (
          <li key={release.key} className="flex justify-between gap-4 py-4 text-sm">
            <span>{release.label}</span>
            <time className="text-zinc-400 tabular-nums" dateTime={release.date}>
              {release.date}
            </time>
          </li>
        ))}
      </ul>
    </section>
  );
}
