import type { CatalogDetailInput } from '@movies/api/catalog';
import type { PdpExtras } from '@movies/api/pdp';
import { useScrollNavigation } from '@native/components/scroll-navigation';
import { Link } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

function CatalogOrganizations({
  items,
  input,
  kind,
}: {
  items: { id: number; name: string }[];
  input: CatalogDetailInput;
  kind: 'company' | 'network';
}) {
  const navigation = useScrollNavigation();
  if (!items.length) {
    return null;
  }
  return (
    <View className="gap-3">
      <Text accessibilityRole="header" className="text-xl font-semibold text-foreground">
        {kind === 'company' ? 'Production Companies' : 'Networks'}
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {items.map((item) => (
          <Link
            key={item.id}
            href={{
              pathname: '/discover',
              params: {
                mediaType: input.type,
                watch_region: input.region,
                [kind + 'Id']: String(item.id),
                page: '1',
              },
            }}
            asChild
          >
            <Pressable
              {...navigation}
              accessibilityRole="link"
              accessibilityLabel={'Discover ' + item.name}
              className="bg-default min-h-11 justify-center rounded-lg border border-border px-3"
            >
              <Text className="text-sm text-foreground">{item.name}</Text>
            </Pressable>
          </Link>
        ))}
      </View>
    </View>
  );
}

export function CatalogOrganizationSections({
  data,
  input,
}: {
  data: PdpExtras;
  input: CatalogDetailInput;
}) {
  return (
    <>
      <CatalogOrganizations items={data.companies} input={input} kind="company" />
      {input.type === 'tv' ? (
        <CatalogOrganizations items={data.networks ?? []} input={input} kind="network" />
      ) : null}
    </>
  );
}
