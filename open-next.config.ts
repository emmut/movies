import { defineCloudflareConfig } from '@opennextjs/cloudflare';
// import r2IncrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache';
// import doQueue from '@opennextjs/cloudflare/overrides/queue/do-queue';
// import tagCache from '@opennextjs/cloudflare/overrides/tag-cache/tag-cache';
//import { withFilter, softTagFilter } from "@opennextjs/cloudflare/overrides/tag-cache/tag-cache-filter";

export default defineCloudflareConfig({
  // incrementalCache: r2IncrementalCache,
  // queue: doQueue,
  // This is only required if you use On-demand revalidation
  // tagCache: tagCache,
  // Disable this if you want to use PPR
  enableCacheInterception: false,
});
