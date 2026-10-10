import { regions, type RegionCode } from '@movies/config/regions';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView as NativeSafeAreaView } from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';

const SafeAreaView = withUniwind(NativeSafeAreaView);
export function RegionPicker({
  visible,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  selected: string;
  onSelect: (region: RegionCode) => void;
  onClose: () => void;
}) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-row items-center justify-between px-5 py-3">
          <Text accessibilityRole="header" className="text-xl font-bold text-foreground">
            Choose your region
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            className="rounded-xl bg-default px-4 py-3"
          >
            <Text className="text-foreground">Done</Text>
          </Pressable>
        </View>
        <ScrollView>
          {regions.map((item) => (
            <Pressable
              key={item.code}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected === item.code }}
              onPress={() => {
                onSelect(item.code);
                onClose();
              }}
              className="flex-row justify-between p-5"
            >
              <Text className="text-lg text-foreground">{item.name}</Text>
              <Text className="text-yellow-600">{selected === item.code ? '✓' : ''}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
