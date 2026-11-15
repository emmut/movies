import type { ReactNode } from 'react';
import { Modal } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

/** Each native modal has its own coordinate space and must measure its own insets. */
export function Sheet({
  children,
  visible = true,
  onRequestClose,
}: {
  children: ReactNode;
  visible?: boolean;
  onRequestClose: () => void;
}) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onRequestClose}
    >
      <SafeAreaProvider>{children}</SafeAreaProvider>
    </Modal>
  );
}
