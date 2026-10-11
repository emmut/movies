import { Text, View } from 'react-native';

const mediaBadges = {
  person: {
    container: 'border-blue-600/70 bg-blue-500/95',
    text: 'text-blue-950',
    label: 'Person',
  },
  movie: {
    container: 'border-yellow-600/70 bg-yellow-500/95',
    text: 'text-yellow-950',
    label: 'Movie',
  },
  tv: { container: 'border-red-600/70 bg-red-500/95', text: 'text-red-950', label: 'TV Show' },
};

export function MediaBadge({ type }: { type: 'movie' | 'tv' | 'person' }) {
  const badge = mediaBadges[type];
  return (
    <View className={`rounded-full border px-2 py-1 ${badge.container}`}>
      <Text className={`text-xs font-medium ${badge.text}`}>{badge.label}</Text>
    </View>
  );
}
