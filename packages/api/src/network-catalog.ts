import 'server-only';
import { gunzipSync } from 'node:zlib';

import { z } from 'zod';

const networkSchema = z.object({ id: z.number().int().positive(), name: z.string().min(1) });
type Network = z.infer<typeof networkSchema>;

const NETWORK_SEARCH_LIMIT = 20;

export async function loadNetworkCatalog(): Promise<Network[]> {
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
export function searchNetworkCatalog(networks: Network[], query: string): Network[] {
  const term = query.toLocaleLowerCase();
  function isExactMatch(network: Network) {
    return network.name.toLocaleLowerCase() === term;
  }
  function compareNetworks(a: Network, b: Network) {
    const exactFirst = Number(isExactMatch(b)) - Number(isExactMatch(a));
    if (exactFirst !== 0) {
      return exactFirst;
    }
    return a.name.localeCompare(b.name);
  }
  return networks
    .filter((network) => network.name.toLocaleLowerCase().includes(term))
    .sort(compareNetworks)
    .slice(0, NETWORK_SEARCH_LIMIT);
}
