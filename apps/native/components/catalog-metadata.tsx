import type { CatalogDetail } from '@movies/api/catalog';
import { formatCertification } from '@movies/api/certifications';
import { CatalogIcon } from '@native/components/catalog-icon';
import { MediaBadge } from '@native/components/media-badge';
import { catalogFacts, catalogStats, type CatalogStat } from '@native/lib/catalog-model';
import { Text, View } from 'react-native';

const statAccents: Record<CatalogStat['accent'], string> = {
  yellow: 'text-yellow-500',
  blue: 'text-blue-500',
  green: 'text-green-500',
  purple: 'text-purple-500',
};

export function CatalogHeading({ item, region }: { item: CatalogDetail; region: string }) {
  const certification = formatCertification(item.certification, region);
  return (
    <View className="gap-3">
      <Text accessibilityRole="header" className="text-3xl font-bold text-foreground">
        {item.title}
      </Text>
      {item.tagline ? <Text className="text-lg italic text-muted">“{item.tagline}”</Text> : null}
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

export function CatalogStats({ item }: { item: CatalogDetail }) {
  return (
    <View className="flex-row flex-wrap gap-3">
      {catalogStats(item).map((stat) => (
        <View key={stat.label} className="min-w-36 flex-1 rounded-lg bg-zinc-900 p-5">
          <CatalogIcon label={stat.label} className={`mb-3 ${statAccents[stat.accent]}`} />
          <Text className="text-2xl font-bold text-white">{stat.value}</Text>
          <Text className="text-sm text-zinc-400">{stat.label}</Text>
          {stat.label === 'TMDB Rating' ? (
            <Text className="text-xs text-zinc-500">
              {item.voteCount.toLocaleString('en-US')} votes
            </Text>
          ) : null}
        </View>
      ))}
    </View>
  );
}

export function CatalogFacts({ item }: { item: CatalogDetail }) {
  return (
    <View className="gap-4">
      {catalogFacts(item).map((fact) => (
        <View key={fact.label} className="gap-1">
          <Text className="text-sm font-semibold uppercase text-muted">{fact.label}</Text>
          <Text className="text-base text-foreground">{fact.value}</Text>
        </View>
      ))}
    </View>
  );
}
