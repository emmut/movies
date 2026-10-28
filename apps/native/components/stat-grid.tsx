import { CatalogIcon } from '@native/components/catalog-icon';
import type { CatalogStat } from '@native/lib/catalog-model';
import { Text, View } from 'react-native';

const accents: Record<CatalogStat['accent'], string> = {
  yellow: 'text-yellow-500',
  blue: 'text-blue-500',
  green: 'text-green-500',
  purple: 'text-purple-500',
};
export function StatGrid({ stats }: { stats: CatalogStat[] }) {
  return (
    <View className="flex-row flex-wrap gap-3">
      {stats.map((stat) => (
        <View
          key={stat.label}
          testID={'stat-' + stat.label}
          className="min-w-36 flex-1 rounded-lg bg-zinc-900 p-5"
        >
          <CatalogIcon label={stat.label} className={'mb-3 ' + accents[stat.accent]} />
          <Text className="text-2xl font-bold text-white">{stat.value}</Text>
          <Text className="text-sm text-zinc-400">{stat.label}</Text>
          {stat.description ? (
            <Text className="text-xs text-zinc-400">{stat.description}</Text>
          ) : null}
        </View>
      ))}
    </View>
  );
}
