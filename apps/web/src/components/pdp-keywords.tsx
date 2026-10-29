import Link from 'next/link';

import Pill from '@/components/pill';
import { getPdpExtras } from '@/lib/pdp';
import { getKeywords } from '@/lib/pdp-extra-content';
import { optional } from '@/lib/tmdb';

export async function PdpKeywords({ type, id }: { type: 'movie' | 'tv'; id: number }) {
  const extras = await optional(getPdpExtras(type, id), null);
  const keywords = getKeywords(extras?.keywords);
  if (keywords.length === 0) {
    return null;
  }

  return (
    <div className="min-w-0">
      <h3 className="mb-2 text-sm font-semibold text-zinc-400 uppercase">Themes &amp; Keywords</h3>
      <ul className="flex flex-wrap gap-2">
        {keywords.map((keyword) => (
          <li key={keyword.id} className="max-w-full min-w-0">
            <Link
              href={`/keyword/${keyword.id}?mediaType=${type}`}
              className="block max-w-full rounded-full focus-visible:ring-2 focus-visible:ring-blue-400"
            >
              <Pill className="h-auto min-h-7 max-w-full py-1 wrap-anywhere whitespace-normal">
                {keyword.name}
              </Pill>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
