import { ArrowUpRight, ChevronDown, Play } from 'lucide-react';
import Link from 'next/link';

import { Imgproxy } from '@/components/image-proxy';
import { ItemSlider } from '@/components/item-slider';
import { getPdpExtras } from '@/lib/pdp';
import { optional } from '@/lib/tmdb';
import type { PdpExtras } from '@/types/pdp';

function ImageGallery({ images }: { images: PdpExtras['images'] }) {
  const pictures = [
    ...(images?.backdrops ?? []).slice(0, 8),
    ...(images?.posters ?? []).slice(0, 8),
  ];
  if (!pictures.length) return null;
  return (
    <section className="border-t border-white/10 pt-8">
      <h2 className="mb-5 text-xl font-semibold tracking-tight">Images</h2>
      <ItemSlider>
        {pictures.map((picture, index) => (
          <a
            key={picture.file_path}
            href={`https://image.tmdb.org/t/p/original${picture.file_path}`}
            target="_blank"
            rel="noreferrer"
            className="group shrink-0 snap-start overflow-hidden rounded-xl border border-white/10 outline-none hover:border-white/30 focus-visible:ring-2 focus-visible:ring-blue-400"
            aria-label={`Open image ${index + 1} in full size`}
          >
            <Imgproxy
              src={picture.file_path}
              alt={`Gallery image ${index + 1}`}
              width={320}
              height={180}
              className="h-44 w-auto transition-transform duration-300 group-hover:scale-105 sm:h-52"
            />
          </a>
        ))}
      </ItemSlider>
    </section>
  );
}

function Videos({ videos }: { videos: PdpExtras['videos'] }) {
  const items =
    videos?.results
      .filter((video) => video.site === 'YouTube' && /^[\w-]+$/.test(video.key))
      .slice(0, 12) ?? [];
  if (!items.length) return null;
  return (
    <section className="border-t border-white/10 pt-8">
      <h2 className="mb-5 text-xl font-semibold tracking-tight">Videos</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((video) => (
          <a
            key={video.id}
            href={`https://www.youtube.com/watch?v=${video.key}`}
            target="_blank"
            rel="noreferrer"
            className="group flex items-start gap-4 rounded-xl border border-white/10 bg-zinc-900/50 p-5 transition-colors hover:border-white/25 hover:bg-zinc-800/70 focus-visible:ring-2 focus-visible:ring-blue-400"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/5 text-zinc-300 transition-colors group-hover:bg-blue-500/15 group-hover:text-blue-400">
              <Play className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-sm leading-relaxed font-medium">{video.name}</p>
              <p className="text-sm text-zinc-400">
                {video.type}
                {video.official ? ' · Official' : ''} · YouTube
              </p>
            </div>
            <ArrowUpRight
              className="h-4 w-4 shrink-0 text-zinc-600 group-hover:text-zinc-300"
              aria-hidden="true"
            />
          </a>
        ))}
      </div>
    </section>
  );
}

function Keywords({ keywords, type }: { keywords: PdpExtras['keywords']; type: 'movie' | 'tv' }) {
  const items = keywords?.keywords ?? keywords?.results ?? [];
  if (!items.length) return null;
  return (
    <details className="group rounded-xl border border-white/10 bg-zinc-900/30 p-5">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-base font-semibold [&::-webkit-details-marker]:hidden">
        <span>
          Themes &amp; Keywords{' '}
          <span className="ml-2 text-xs font-normal text-zinc-500">Spoilers</span>
        </span>
        <ChevronDown
          className="h-4 w-4 shrink-0 text-zinc-500 transition-transform group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <div className="mt-5 flex flex-wrap gap-2 border-t border-white/10 pt-5">
        {items.map((keyword) => (
          <Link
            key={keyword.id}
            href={`/keyword/${keyword.id}?mediaType=${type}`}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:border-blue-400/40 hover:text-white focus-visible:ring-2 focus-visible:ring-blue-400"
          >
            {keyword.name}
          </Link>
        ))}
      </div>
    </details>
  );
}

const RELEASE_TYPES: Record<number, string> = {
  1: 'Premiere',
  2: 'Limited theatrical',
  3: 'Theatrical',
  4: 'Digital',
  5: 'Physical',
  6: 'TV',
};
function RegionalReleases({
  releases,
  region,
}: {
  releases: PdpExtras['release_dates'];
  region: string;
}) {
  const dates =
    releases?.results.find((result) => result.iso_3166_1 === region)?.release_dates ?? [];
  const unique = [
    ...new Map(
      dates.map((date) => [`${date.type}:${date.release_date.slice(0, 10)}`, date]),
    ).values(),
  ].sort((a, b) => a.release_date.localeCompare(b.release_date));
  if (!unique.length) return null;
  return (
    <section className="border-t border-white/10 pt-8">
      <h2 className="mb-5 text-xl font-semibold tracking-tight">Release Dates · {region}</h2>
      <ul className="divide-y divide-white/5 rounded-xl border border-white/10 bg-zinc-900/30 px-5">
        {unique.map((date) => (
          <li
            key={`${date.type}:${date.release_date}`}
            className="flex justify-between gap-4 py-4 text-sm"
          >
            <span>{RELEASE_TYPES[date.type] ?? 'Release'}</span>
            <time className="text-zinc-400 tabular-nums" dateTime={date.release_date}>
              {date.release_date.slice(0, 10)}
            </time>
          </li>
        ))}
      </ul>
    </section>
  );
}

export async function PdpAdditionalContent({
  type,
  id,
  region,
}: {
  type: 'movie' | 'tv';
  id: number;
  region: string;
}) {
  const extras = await optional(getPdpExtras(type, id), null);
  if (!extras) return null;
  return (
    <div className="space-y-8">
      <RegionalReleases releases={extras.release_dates} region={region} />
      <ImageGallery images={extras.images} />
      <Videos videos={extras.videos} />
      <Keywords keywords={extras.keywords} type={type} />
    </div>
  );
}
