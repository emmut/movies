import { ArrowUpRight, Play } from 'lucide-react';

import { Imgproxy } from '@/components/image-proxy';
import { ItemSlider } from '@/components/item-slider';
import { getPdpExtras } from '@/lib/pdp';
import { getGalleryImages, getPlayableVideos, getRegionalReleases } from '@/lib/pdp-extra-content';
import { optional } from '@/lib/tmdb';

function ImageGallery({ pictures }: { pictures: ReturnType<typeof getGalleryImages> }) {
  if (pictures.length === 0) {
    return null;
  }
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

function Videos({ items }: { items: ReturnType<typeof getPlayableVideos> }) {
  if (items.length === 0) {
    return null;
  }
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
              <p className="line-clamp-2 text-sm leading-relaxed font-medium wrap-anywhere">
                {video.name}
              </p>
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

function RegionalReleases({
  dates,
  region,
}: {
  dates: ReturnType<typeof getRegionalReleases>;
  region: string;
}) {
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
  if (!extras) {
    return null;
  }
  const pictures = getGalleryImages(extras.images);
  const videos = getPlayableVideos(extras.videos);
  const releaseDates = getRegionalReleases(extras.release_dates, region);
  return (
    <div className="space-y-8">
      <RegionalReleases dates={releaseDates} region={region} />
      <ImageGallery pictures={pictures} />
      <Videos items={videos} />
    </div>
  );
}
