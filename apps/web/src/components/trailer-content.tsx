import { getPdpExtras } from '@/lib/pdp';
import { getPlayableVideos } from '@/lib/pdp-extra-content';
import { optional } from '@/lib/tmdb';

import { TrailerButton } from './trailer-button';

/** Streams the trailer and additional videos without blocking the title details. */
export async function TrailerContent({
  mediaType,
  mediaId,
  title,
}: {
  mediaType: 'movie' | 'tv';
  mediaId: number;
  title: string;
}) {
  const extras = await optional(getPdpExtras(mediaType, mediaId), null);
  const videos = getPlayableVideos(extras?.videos);
  if (videos.length === 0) {
    return null;
  }

  return <TrailerButton videos={videos} title={title} mediaType={mediaType} />;
}
