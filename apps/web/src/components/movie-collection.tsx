import { BackTargetLink } from '@/components/back-target-link';
import { ItemSlider } from '@/components/item-slider';
import { PosterArtwork } from '@/components/poster-artwork';
import { getCollection } from '@/lib/pdp';
import { optional } from '@/lib/tmdb';

export async function MovieCollection({
  collectionId,
  currentId,
}: {
  collectionId: number;
  currentId: number;
}) {
  const collection = await optional(getCollection(collectionId), null);
  if (!collection) {
    return null;
  }
  const parts = collection.parts
    .filter((part) => part.id !== currentId)
    .sort((a, b) => (a.release_date || '9999').localeCompare(b.release_date || '9999'));
  if (!parts.length) {
    return null;
  }
  return (
    <section className="border-t border-white/10 pt-8">
      <h2 className="mb-5 text-xl font-semibold tracking-tight">{collection.name}</h2>
      <ItemSlider>
        {parts.map((part) => (
          <BackTargetLink
            key={part.id}
            href={`/movie/${part.id}`}
            className="group w-36 shrink-0 snap-start space-y-3 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-blue-400 sm:w-40"
          >
            <PosterArtwork path={part.poster_path} title={part.title} type="movie" />
            <p className="line-clamp-2 text-sm leading-snug font-medium wrap-anywhere text-zinc-200 group-hover:text-white">
              {part.title}
            </p>
            <p className="text-sm wrap-anywhere text-zinc-400">
              {part.release_date?.slice(0, 4) || 'Release date TBA'}
            </p>
          </BackTargetLink>
        ))}
      </ItemSlider>
    </section>
  );
}
