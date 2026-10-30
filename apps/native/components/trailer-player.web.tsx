import { trailerEmbedUrl } from '@movies/api/catalog-support';

export function TrailerPlayer({ videoKey, title }: { videoKey: string; title: string }) {
  return (
    <iframe
      title={`${title} - Trailer`}
      src={trailerEmbedUrl(videoKey)}
      className="h-full w-full border-0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      referrerPolicy="strict-origin-when-cross-origin"
    />
  );
}
