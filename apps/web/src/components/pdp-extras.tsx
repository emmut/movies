import Link from 'next/link';

import { Imgproxy } from '@/components/image-proxy';
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
    <section>
      <h2 className="mb-3 text-xl font-semibold">Images</h2>
      <div className="flex gap-3 overflow-x-auto pb-3">
        {pictures.map((picture, index) => (
          <a
            key={picture.file_path}
            href={`https://image.tmdb.org/t/p/original${picture.file_path}`}
            target="_blank"
            rel="noreferrer"
            className="shrink-0"
            aria-label={`Open image ${index + 1} in full size`}
          >
            <Imgproxy
              src={picture.file_path}
              alt={`Gallery image ${index + 1}`}
              width={320}
              height={180}
              className="h-44 w-auto rounded-lg"
            />
          </a>
        ))}
      </div>
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
    <section>
      <h2 className="mb-3 text-xl font-semibold">Videos</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((video) => (
          <a
            key={video.id}
            href={`https://www.youtube.com/watch?v=${video.key}`}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg bg-zinc-900 p-4 hover:bg-zinc-800"
          >
            <p className="font-medium">{video.name}</p>
            <p className="text-sm text-zinc-400">
              {video.type}
              {video.official ? ' · Official' : ''} · Watch on YouTube ↗
            </p>
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
    <details>
      <summary className="cursor-pointer text-xl font-semibold">
        Themes &amp; Keywords (may contain spoilers)
      </summary>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((keyword) => (
          <Link
            key={keyword.id}
            href={`/keyword/${keyword.id}?mediaType=${type}`}
            className="rounded-full bg-zinc-800 px-3 py-1 text-sm hover:bg-zinc-700"
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
    <section>
      <h2 className="mb-3 text-xl font-semibold">Release Dates · {region}</h2>
      <ul className="space-y-2">
        {unique.map((date) => (
          <li
            key={`${date.type}:${date.release_date}`}
            className="flex justify-between gap-4 rounded-lg bg-zinc-900 p-3"
          >
            <span>{RELEASE_TYPES[date.type] ?? 'Release'}</span>
            <time dateTime={date.release_date}>{date.release_date.slice(0, 10)}</time>
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
    <div className="space-y-6">
      <RegionalReleases releases={extras.release_dates} region={region} />
      <Keywords keywords={extras.keywords} type={type} />
      <ImageGallery images={extras.images} />
      <Videos videos={extras.videos} />
    </div>
  );
}
