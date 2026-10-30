import { Pressable, Text } from 'react-native';

export function SettingsSaveButton({
  pending,
  disabled,
  label,
  onSave,
}: {
  pending: boolean;
  disabled: boolean;
  label: string;
  onSave: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled, busy: pending }}
      disabled={disabled}
      className={
        'min-h-12 items-center justify-center rounded-lg bg-foreground px-4 ' +
        (disabled ? 'opacity-50' : '')
      }
      onPress={onSave}
    >
      <Text className="font-semibold text-background">{pending ? 'Saving...' : label}</Text>
    </Pressable>
  );
}

export function SettingsSaveFeedback({
  status,
  errorMessage,
  successMessage,
}: {
  status: 'idle' | 'pending' | 'error' | 'success';
  errorMessage: string;
  successMessage: string;
}) {
  if (status === 'error') {
    return (
      <Text accessibilityRole="alert" className="text-red-500">
        {errorMessage}
      </Text>
    );
  }
  if (status === 'success') {
    return (
      <Text accessibilityRole="alert" className="text-foreground">
        {successMessage}
      </Text>
    );
  }
  return null;
}
