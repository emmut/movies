import { PopcornIcon } from '@native/components/icons';
import { Text, View } from 'react-native';

export function Brand() {
  return (
    <View className="flex-row items-center gap-2" accessibilityLabel="Movies">
      <PopcornIcon testID="brand-icon" className="size-6 text-foreground" accessible={false} />
      <Text className="text-xl font-light text-foreground">Movies</Text>
    </View>
  );
}
