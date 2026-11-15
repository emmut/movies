import { Text } from 'react-native';

export function ListMutationError({
  failed,
  action = 'update your list',
}: {
  failed: boolean;
  action?: string;
}) {
  if (!failed) {
    return null;
  }
  return (
    <Text accessibilityRole="alert" className="text-red-600 dark:text-red-400">
      Couldn’t {action}. Please try again.
    </Text>
  );
}
