import { Text, View } from 'react-native';

export function FactGrid({ facts }: { facts: { label: string; value: string | null }[] }) {
  return (
    <View className="gap-4">
      {facts.map((fact) => (
        <View key={fact.label} className="gap-1">
          <Text className="text-sm font-semibold uppercase text-muted">{fact.label}</Text>
          <Text className="text-base text-foreground">{fact.value}</Text>
        </View>
      ))}
    </View>
  );
}
