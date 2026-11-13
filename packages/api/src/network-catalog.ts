import 'server-only';
import { gunzipSync } from 'node:zlib';

import { z } from 'zod';

const networkSchema = z.object({ id: z.number().int().positive(), name: z.string().min(1) });

export async function loadNetworkCatalog() {
  // Yesterday's export is complete even before today's publication at 08:00 UTC.
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - 1);
  const stamp = [date.getUTCMonth() + 1, date.getUTCDate(), date.getUTCFullYear()]
    .map((part) => String(part).padStart(2, '0'))
    .join('_');
  const response = await fetch(`https://files.tmdb.org/p/exports/tv_network_ids_${stamp}.json.gz`, {
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    throw new Error('Failed loading network catalogue');
  }
  const data = gunzipSync(Buffer.from(await response.arrayBuffer()), {
    maxOutputLength: 10_000_000,
  });
  const networks = data
    .toString('utf8')
    .trim()
    .split('\n')
    .map((line) => networkSchema.parse(JSON.parse(line)));
  if (networks.length === 0) {
    throw new Error('Empty network catalogue');
  }
  return networks;
}

/** Keep web and native exact-name ordering and result limits in sync. */
export function searchNetworkCatalog(networks: { id: number; name: string }[], query: string) {
  const term = query.toLocaleLowerCase();
  return networks
    .filter((network) => network.name.toLocaleLowerCase().includes(term))
    .sort(
      (a, b) =>
        Number(b.name.toLocaleLowerCase() === term) - Number(a.name.toLocaleLowerCase() === term) ||
        a.name.localeCompare(b.name),
    )
    .slice(0, 20);
}
