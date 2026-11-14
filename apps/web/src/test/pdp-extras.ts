import type { PdpExtras } from '@movies/api/pdp';
import {
  getGalleryImages,
  getKeywords,
  getPlayableVideos,
  getRegionalReleases,
} from '@movies/api/pdp-extra-content';
import type { PdpExtras as UpstreamExtras } from '@movies/api/tmdb-types/pdp';

/** Build API-shaped fixtures from the existing upstream examples in rendering tests. */
export function pdpExtrasFixture(raw: UpstreamExtras = {}): PdpExtras {
  return {
    companies: [],
    networks: [],
    collection: null,
    images: getGalleryImages(raw.images),
    keywords: getKeywords(raw.keywords),
    videos: getPlayableVideos(raw.videos),
    releases: getRegionalReleases(raw.release_dates, 'SE'),
    seasons: [],
    next: null,
    latest: null,
  };
}
