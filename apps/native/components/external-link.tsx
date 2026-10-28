import { ArrowUpRightIcon } from '@native/components/icons';
import { Alert, Linking, Pressable, Text } from 'react-native';

export function ExternalLink({
  href,
  children,
  prominent = false,
}: {
  href: string;
  children: string;
  prominent?: boolean;
}) {
  const colors = prominent ? 'border-yellow-600 bg-yellow-600' : 'border-border';
  const textColor = prominent ? 'font-semibold text-black' : 'text-foreground';
  const iconColor = prominent ? 'text-black' : 'text-muted';
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${children} (opens browser)`}
      className={
        'min-h-11 flex-row items-center justify-center gap-2 rounded-lg border px-3 py-2 ' + colors
      }
      onPress={() => {
        void Linking.openURL(href).catch(() =>
          Alert.alert('Couldn’t open link', 'Please try again.'),
        );
      }}
    >
      <Text className={'text-sm ' + textColor}>{children}</Text>
      <ArrowUpRightIcon className={'size-4 ' + iconColor} accessible={false} />
    </Pressable>
  );
}
