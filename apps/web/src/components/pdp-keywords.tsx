import { KeywordBubbles } from '@/components/keyword-bubbles';
import { getPdpExtras } from '@/lib/pdp';
import { getKeywords } from '@/lib/pdp-extra-content';
import { optional } from '@/lib/tmdb';

export async function PdpKeywords({ type, id }: { type: 'movie' | 'tv'; id: number }) {
  const extras = await optional(getPdpExtras(type, id), null);
  const keywords = getKeywords(extras?.keywords);
  if (keywords.length === 0) {
    return null;
  }

  return <KeywordBubbles keywords={keywords} type={type} />;
}
