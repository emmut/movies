import type { CatalogDetail } from '@movies/api/catalog';
import { formatCertification } from '@movies/api/certifications';
import type { ImdbRating } from '@movies/api/imdb';
import { FactGrid } from '@native/components/fact-grid';
import { MediaBadge } from '@native/components/media-badge';
import { StatGrid } from '@native/components/stat-grid';
import { catalogFacts, catalogStats } from '@native/lib/catalog-model';
import { Text, View } from 'react-native';

export function CatalogHeading({ item, region }: { item: CatalogDetail; region: string }) {
  const certification = formatCertification(item.certification, region);
  return (
    <View className="gap-3">
      <Text accessibilityRole="header" className="text-3xl font-bold text-foreground">
        {item.title}
      </Text>
      {item.tagline ? <Text className="text-lg text-muted italic">“{item.tagline}”</Text> : null}
      <View className="flex-row flex-wrap gap-2">
        <MediaBadge type={item.type} />
        {certification ? (
          <View className="rounded-full border border-blue-600/70 bg-blue-500 px-2 py-1">
            <Text className="text-xs font-medium text-blue-950">Rated {certification}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

export function CatalogStats({
  item,
  imdb = null,
}: {
  item: CatalogDetail;
  imdb?: ImdbRating | null;
}) {
  return <StatGrid stats={catalogStats(item, imdb)} />;
}

export function CatalogFacts({ item }: { item: CatalogDetail }) {
  return <FactGrid facts={catalogFacts(item)} />;
}
