import { defineCloudflareConfig } from '@opennextjs/cloudflare';
// import r2IncrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache';
// import doQueue from '@opennextjs/cloudflare/overrides/queue/do-queue';
// import doShardedTagCache from '@opennextjs/cloudflare/overrides/tag-cache/do-sharded-tag-cache';
//import { withFilter, softTagFilter } from "@opennextjs/cloudflare/overrides/tag-cache/tag-cache-filter";

export default defineCloudflareConfig({
  // incrementalCache: r2IncrementalCache,
  // queue: doQueue,
  // This is only required if you use On-demand revalidation
  // tagCache: doShardedTagCache({ baseShardSize: 12, regionalCache: true }),
  //If you don't use `revalidatePath`, you can also filter internal soft tags using the `softTagFilter`
  // tagCache: withFilter({
  //   tagCache: d1NextTagCache,
  //   filterFn: softTagFilter,
  // }),
  // Disable this if you want to use PPR
  enableCacheInterception: false,
});
