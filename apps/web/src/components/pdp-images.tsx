import { getGalleryImages } from '@movies/api/pdp-extra-content';
import { Expand } from 'lucide-react';

import ClientImage from '@/components/client-image';
import { ItemSlider } from '@/components/item-slider';
import { MediaViewer, MediaViewerTrigger } from '@/components/media-viewer';
import { buildProxyImageUrls } from '@/lib/imgproxy-url';
import { getPdpExtras } from '@/lib/pdp';
import { optional } from '@/lib/tmdb';

export async function PdpImages({
  type,
  id,
  title,
}: {
  type: 'movie' | 'tv';
  id: number;
  title: string;
}) {
  const extras = await optional(getPdpExtras(type, id), null);
  const pictures = getGalleryImages(extras?.images);
  if (pictures.length === 0) {
    return null;
  }

  const images = pictures.map((picture, index) => ({
    id: picture.file_path,
    title: `Image ${index + 1}`,
    full: buildProxyImageUrls(picture.file_path, { width: 1920, height: 1440 }),
    thumbnail: buildProxyImageUrls(picture.file_path, { width: 480, height: 270, fill: true }),
  }));
  const slides = images.map((image) => ({
    id: image.id,
    title: image.title,
    content: (
      <ClientImage
        imageUrls={image.full}
        fallbackSrc={image.full.src}
        alt={image.title}
        className="h-full w-full object-contain"
        eager
      />
    ),
  }));

  return (
    <section aria-label="Images" className="space-y-4 border-t border-white/10 pt-6">
      <h2 className="text-xl font-semibold tracking-tight">
        Images <span className="ml-1 text-sm font-normal text-zinc-500">{images.length}</span>
      </h2>
      <MediaViewer title={`${title} — Images`} items={slides}>
        <ItemSlider>
          {images.map((image, index) => (
            <MediaViewerTrigger
              key={image.id}
              index={index}
              label={`Open image ${index + 1} of ${images.length}`}
              className="group relative aspect-video w-56 shrink-0 snap-start overflow-hidden rounded-xl border border-white/10 bg-zinc-900 transition-colors outline-none hover:border-white/30 focus-visible:ring-2 focus-visible:ring-blue-400 sm:w-72 [&_picture]:contents"
            >
              <ClientImage
                imageUrls={image.thumbnail}
                fallbackSrc={image.thumbnail.src}
                alt={image.title}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transform-none"
              />
              <span className="absolute top-2 right-2 rounded-full bg-black/60 p-2 text-white/80">
                <Expand className="size-3.5" aria-hidden="true" />
              </span>
            </MediaViewerTrigger>
          ))}
        </ItemSlider>
      </MediaViewer>
    </section>
  );
}
