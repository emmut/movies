import { Text, View } from 'react-native';
import NativeSvg, { Path } from 'react-native-svg';
import { withUniwind } from 'uniwind';

const Svg = withUniwind(NativeSvg);

export function Brand() {
  return (
    <View className="flex-row items-center gap-2" accessibilityLabel="Movies">
      {/* Lucide Popcorn geometry, ISC license: https://lucide.dev/license */}
      <Svg
        width={24}
        height={24}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-foreground"
        accessible={false}
      >
        <Path d="M18 8a2 2 0 0 0 0-4 2 2 0 0 0-4 0 2 2 0 0 0-4 0 2 2 0 0 0-4 0 2 2 0 0 0 0 4" />
        <Path d="M10 22 9 8" />
        <Path d="m14 22 1-14" />
        <Path d="M20 8c.5 0 .9.4.8 1l-2.6 12c-.1.5-.7 1-1.2 1H7c-.6 0-1.1-.4-1.2-1L3.2 9c-.1-.6.3-1 .8-1Z" />
      </Svg>
      <Text className="text-xl font-light text-foreground">Movies</Text>
    </View>
  );
}
