import { ArrowUpRightIcon } from '@native/components/icons';
import { Alert, Linking, Pressable, Text } from 'react-native';

export function ExternalLink({ href, children }: { href: string; children: string }) {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${children} (opens browser)`}
      className="min-h-11 flex-row items-center justify-center gap-2 rounded-lg border border-border px-3 py-2"
      onPress={() => {
        void Linking.openURL(href).catch(() =>
          Alert.alert('Couldn’t open link', 'Please try again.'),
        );
      }}
    >
      <Text className="text-sm text-foreground">{children}</Text>
      <ArrowUpRightIcon className="size-4 text-muted" accessible={false} />
    </Pressable>
  );
}
